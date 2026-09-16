import { useConvex, useQuery } from "convex/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	canMove,
	type DesktopFile,
	isInTrash,
	parseSavedFiles,
	portfolioFiles,
	validateName,
} from "@/lib/fileSystem";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

const STORAGE_KEY = "cris-desktop-files-v1";
const aliases: Record<string, string> = {
	"ABOUT_ME.txt": "about",
	"PROJECTS.d": "projects-overview",
	"BLOG.txt": "writing-overview",
	"README.md": "readme",
	"ContactMe.app": "contact-app",
};
interface FileSystem {
	files: DesktopFile[];
	loading: boolean;
	storageError: string;
	cloudError: string;
	getFile: (id: string) => DesktopFile | undefined;
	create: (
		name: string,
		type: "file" | "directory",
		parentId: string,
	) => string;
	rename: (id: string, name: string) => void;
	updateContent: (id: string, content: string) => void;
	trash: (id: string) => void;
	restore: (id: string) => void;
	move: (id: string, parentId: string) => void;
}
const Context = createContext<FileSystem | null>(null);

export function FileSystemProvider({ children }: { children: ReactNode }) {
	const roots = useQuery(api.files.getRootFiles);
	const convex = useConvex();
	const [nested, setNested] = useState<Doc<"files">[]>([]);
	const [local, setLocal] = useState<DesktopFile[]>([]);
	const localRef = useRef(local);
	localRef.current = local;
	const [ready, setReady] = useState(false);
	const [storageError, setStorageError] = useState("");
	const [cloudError, setCloudError] = useState("");
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		try {
			setLocal(parseSavedFiles(localStorage.getItem(STORAGE_KEY)));
		} catch {
			setStorageError(
				"Your saved workspace couldn't be read. New changes will stay in this session.",
			);
		}
		setReady(true);
	}, []);
	useEffect(() => {
		if (!roots) return;
		let cancelled = false;
		async function readFolders() {
			setLoading(true);
			try {
				const collected: Doc<"files">[] = [];
				let folders = (roots ?? []).filter((file) => file.type === "directory");
				const visited = new Set<string>();
				while (folders.length && !cancelled) {
					const batch = folders.filter((file) => !visited.has(file._id));
					batch.forEach((file) => {
						visited.add(file._id);
					});
					const children = (
						await Promise.all(
							batch.map((file) =>
								convex.query(api.files.getFilesByParent, {
									parentId: file._id,
								}),
							),
						)
					).flat();
					collected.push(...children);
					folders = children.filter((file) => file.type === "directory");
				}
				if (!cancelled) {
					setNested(collected);
					setCloudError("");
				}
			} catch {
				if (!cancelled)
					setCloudError(
						"Some published folders couldn't load. Your local workspace is still available.",
					);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		void readFolders();
		return () => {
			cancelled = true;
		};
	}, [roots, convex]);
	const files = useMemo(() => {
		const base = portfolioFiles.map((file) => ({ ...file }));
		for (const doc of [...(roots ?? []), ...nested]) {
			const matching = !doc.parentId && aliases[doc.name];
			const builtIn = matching
				? base.find((file) => file.id === matching)
				: undefined;
			if (builtIn) {
				if (builtIn.id !== "readme")
					builtIn.content = doc.content ?? builtIn.content;
				builtIn.updatedAt = doc.updatedAt;
				builtIn.sourceId = doc._id;
			} else {
				base.push({
					id: doc._id,
					name: doc.name,
					type: doc.type ?? "file",
					content: doc.content,
					appComponent: doc.appComponent,
					parentId: doc.parentId ?? "home",
					updatedAt: doc.updatedAt,
				});
			}
		}
		return [...base, ...local];
	}, [roots, nested, local]);
	const currentFiles = () => [
		...files.filter((file) => !file.local),
		...localRef.current,
	];
	const getFile = (id: string) =>
		currentFiles().find((file) => file.id === id || file.sourceId === id);
	const commit = (next: DesktopFile[]) => {
		if (!ready)
			throw new Error(
				"Your workspace is still loading. Try again in a moment.",
			);
		try {
			if (!storageError)
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			setStorageError(
				"Browser storage is unavailable or full. Changes will last for this session only.",
			);
		}
		localRef.current = next;
		setLocal(next);
	};
	const writable = (id: string) => {
		const file = localRef.current.find((item) => item.id === id);
		if (!file)
			throw new Error(
				"Portfolio files are read-only. Create your own note in Finder.",
			);
		return file;
	};
	const patch = (id: string, changes: Partial<DesktopFile>) => {
		writable(id);
		commit(
			localRef.current.map((file) =>
				file.id === id
					? { ...file, ...changes, updatedAt: new Date().toISOString() }
					: file,
			),
		);
	};
	return (
		<Context.Provider
			value={{
				files,
				loading: !ready || loading,
				storageError,
				cloudError,
				getFile,
				create: (name, type, parentId) => {
					if (parentId !== "home") {
						const parent = getFile(parentId);
						if (
							!parent ||
							parent.type !== "directory" ||
							isInTrash(parent, files)
						)
							throw new Error("Choose an available folder first.");
					}
					const id = `local-${crypto.randomUUID()}`;
					commit([
						...localRef.current,
						{
							id,
							name: validateName(name, parentId, currentFiles()),
							type,
							parentId,
							content:
								type === "file"
									? "# A new idea\n\nStart writing here…"
									: undefined,
							local: true,
							updatedAt: new Date().toISOString(),
						},
					]);
					return id;
				},
				rename: (id, name) => {
					const file = writable(id);
					patch(id, {
						name: validateName(name, file.parentId, currentFiles(), id),
					});
				},
				updateContent: (id, content) => patch(id, { content }),
				trash: (id) => patch(id, { deleted: true }),
				restore: (id) => {
					const file = writable(id);
					const parent = getFile(file.parentId);
					const parentId =
						file.parentId === "home" ||
						(parent && !isInTrash(parent, currentFiles()))
							? file.parentId
							: "home";
					validateName(file.name, parentId, currentFiles(), id);
					patch(id, { deleted: false, parentId });
				},
				move: (id, parentId) => {
					const file = writable(id);
					if (!canMove(file, parentId, files))
						throw new Error("A folder can't be moved inside itself.");
					validateName(file.name, parentId, files, id);
					patch(id, { parentId });
				},
			}}
		>
			{children}
		</Context.Provider>
	);
}

export function useFileSystem() {
	const context = useContext(Context);
	if (!context)
		throw new Error("useFileSystem must be used within FileSystemProvider");
	return context;
}
