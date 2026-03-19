import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Activity,
	Aperture,
	BookText,
	FileText,
	FileUser,
	FolderKanban,
	Mail,
	Thermometer,
	UserRound,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import File from "@/components/File";
import { RightClickMenu } from "@/components/RightClickMenu";
import { WidgetSidebar } from "@/components/widgets/WidgetSidebar";
import { AboutWindow } from "@/components/windows/AboutWindow";
import { BlogWindow } from "@/components/windows/BlogWindow";
import { ContactWindow } from "@/components/windows/ContactWindow";
import { CreateFileWindow } from "@/components/windows/CreateFileWindow";
import { FileViewerWindow } from "@/components/windows/FileViewerWindow";
import { ProjectsWindow } from "@/components/windows/ProjectsWindow";
import { ReadmeWindow } from "@/components/windows/ReadmeWindow";
import {
	useWindowManager,
	WindowManagerProvider,
} from "@/contexts/WindowManagerContext";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
	component: App,
	validateSearch: (search: Record<string, unknown>) => ({
		open: Array.isArray(search.open)
			? search.open.filter((v): v is string => typeof v === "string")
			: typeof search.open === "string"
				? [search.open]
				: [],
		maximized: Array.isArray(search.maximized)
			? search.maximized.filter((v): v is string => typeof v === "string")
			: typeof search.maximized === "string"
				? [search.maximized]
				: [],
		file: typeof search.file === "string" ? search.file : undefined,
	}),
});

function App() {
	const { open, maximized, file } = Route.useSearch();
	const navigate = Route.useNavigate();
	return (
		<WindowManagerProvider
			openWindows={open}
			maximizedWindows={maximized}
			openFile={file}
			navigate={navigate}
		>
			<Desktop />
		</WindowManagerProvider>
	);
}

function Desktop() {
	const desktopRef = useRef<HTMLDivElement | null>(null);
	const { toggle, open: openWindow, openFile, setOpenFile } =
		useWindowManager();
	const files = useQuery(api.files.getFiles);

	// Resolve file data from URL param
	const fileData = useMemo(() => {
		if (!openFile || !files) return null;
		const found = files.find((f) => f.name === openFile);
		if (!found) return null;
		return {
			name: found.name,
			content: found.content,
			createdAt: found._creationTime,
			updatedAt: found.updatedAt,
		};
	}, [openFile, files]);

	const [widgetBarOpen, setWidgetBarOpen] = useState(false);
	const [fileContextMenuOpen, setFileContextMenuOpen] = useState(false);
	const [contextMenuOpen, setContextMenuOpen] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState({
		x: 0,
		y: 0,
	});

	return (
		<div
			className="w-full h-full relative overflow-hidden"
			onContextMenu={(e) => {
				e.preventDefault();
				setContextMenuOpen(true);
				setContextMenuPosition({ x: e.pageX, y: e.pageY });
			}}
		>
			{contextMenuOpen && !fileContextMenuOpen && (
				<RightClickMenu
					position={contextMenuPosition}
					onClose={() => setContextMenuOpen(false)}
					onCreateFile={() => {
						openWindow("createFile");
					}}
				/>
			)}
			<div className="w-full h-full inset-0 bg-black z-[-1] overflow-hidden">
				<video
					autoPlay
					loop
					muted
					className="hidden md:block fixed top-0 left-0 w-full h-full object-cover z-0 opacity-80"
				>
					<source src="/background.mp4" type="video/mp4" />
					Your browser does not support the video tag.
				</video>
			</div>
			<header className="w-full py-2 px-4 bg-slate-800 backdrop-blur-md flex justify-between items-center z-40">
				<div className="flex items-center space-x-2">
					<Aperture size={20} className="text-sky-400" />
					<span className="text-sm text-white font-semibold">
						Cris's Desktop
					</span>
				</div>
				<div className="flex items-center space-x-2">
					<button
						type="button"
						onClick={() => setWidgetBarOpen((prev) => !prev)}
						className="hidden md:block"
					>
						<Activity
							size={18}
							className={`transition-opacity ${widgetBarOpen ? "text-sky-400 opacity-100" : "text-white opacity-50 hover:opacity-80"}`}
						/>
					</button>
					<button
						type="button"
						onClick={() => setWidgetBarOpen((prev) => !prev)}
						className="hidden md:block"
					>
						<Thermometer
							size={18}
							className={`transition-opacity ${widgetBarOpen ? "text-sky-400 opacity-100" : "text-white opacity-50 hover:opacity-80"}`}
						/>
					</button>
					<div className="text-xs text-white/50">Guest</div>
					<UserRound size={20} className="text-sky-400" />
				</div>
			</header>

			<section
				ref={desktopRef}
				className="grid grid-cols-4 place-items-center min-h-screen bg-gradient-to-br from-slate-700 via-stone-950 to-cyan-900 text-white overflow-hidden"
			>
				{files &&
					files.map((file) => (
						<File
							id={file._id}
							key={file._id.toString()}
							name={file.name}
							onClick={() => {
								setOpenFile(file.name);
							}}
							icon={<BookText size={36} />}
							position={file.position}
							fileContextMenuOpen={setFileContextMenuOpen}
						/>
					))}
				<File
					name="ABOUT_ME.txt"
					onClick={() => toggle("about")}
					icon={<FileUser size={36} />}
					position={{ x: 20, y: 20 }}
				/>
				<File
					name="PROJECTS.d"
					onClick={() => toggle("projects")}
					icon={<FolderKanban size={36} />}
					position={{ x: 20, y: 120 }}
				/>
				<File
					name="BLOG.txt"
					onClick={() => toggle("blog")}
					icon={<FileText size={36} />}
					position={{ x: 20, y: 220 }}
				/>
				<File
					name="README.md"
					onClick={() => toggle("readme")}
					icon={<BookText size={36} />}
					position={{ x: 20, y: 320 }}
				/>
				<File
					name="ContactMe.app"
					onClick={() => toggle("contact")}
					icon={<Mail size={36} />}
					position={{ x: 20, y: 420 }}
				/>

				<FileViewerWindow
					parentRef={desktopRef}
					file={fileData}
					onClose={() => setOpenFile(undefined)}
				/>
				<AboutWindow parentRef={desktopRef} />
				<ProjectsWindow parentRef={desktopRef} />
				<BlogWindow parentRef={desktopRef} />
				<ReadmeWindow parentRef={desktopRef} />
				<ContactWindow parentRef={desktopRef} />
				<CreateFileWindow
					parentRef={desktopRef}
					contextMenuPosition={contextMenuPosition}
				/>

				<WidgetSidebar open={widgetBarOpen} onClose={() => setWidgetBarOpen(false)} />
			</section>
		</div>
	);
}
