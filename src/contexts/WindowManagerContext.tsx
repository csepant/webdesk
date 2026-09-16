import type { UseNavigateResult } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import type { WindowFrame } from "@/lib/windowGeometry";

export const WINDOW_IDS = ["contact", "fileViewer", "finder"] as const;
export type WindowId = (typeof WINDOW_IDS)[number];
interface SearchState {
	open: string[];
	maximized: string[];
	file?: string;
	folder?: string;
}
interface WindowManagerContextValue {
	isOpen: (id: string) => boolean;
	open: (id: string) => void;
	close: (id: string) => void;
	bringToFront: (id: string) => void;
	getZIndex: (id: string) => number;
	activeWindow: string | undefined;
	isMaximized: (id: string) => boolean;
	toggleMaximized: (id: string) => void;
	isMinimized: (id: string) => boolean;
	minimize: (id: string) => void;
	openFile: string | undefined;
	setOpenFile: (id: string | undefined) => void;
	openFolder: string;
	setOpenFolder: (id: string) => void;
	frames: Record<string, WindowFrame>;
	setFrame: (id: string, frame: WindowFrame) => void;
}
const Context = createContext<WindowManagerContextValue | null>(null);

export function WindowManagerProvider({
	children,
	openWindows,
	maximizedWindows,
	openFile,
	openFolder,
	navigate,
}: {
	children: ReactNode;
	openWindows: string[];
	maximizedWindows: string[];
	openFile?: string;
	openFolder?: string;
	navigate: UseNavigateResult<"/">;
}) {
	const [zOrder, setZOrder] = useState(openWindows);
	const [minimized, setMinimized] = useState<string[]>([]);
	const [frames, setFrames] = useState<Record<string, WindowFrame>>({});
	const search = useRef<SearchState>({
		open: openWindows,
		maximized: maximizedWindows,
		file: openFile,
		folder: openFolder,
	});
	search.current = {
		open: openWindows,
		maximized: maximizedWindows,
		file: openFile,
		folder: openFolder,
	};
	const update = useCallback(
		(changes: Partial<SearchState>) => {
			search.current = { ...search.current, ...changes };
			void navigate({
				to: "/",
				search: (previous) => ({
					...previous,
					...changes,
				}),
				replace: true,
			});
		},
		[navigate],
	);
	const bringToFront = useCallback((id: string) => {
		setZOrder((previous) =>
			previous.at(-1) === id
				? previous
				: [...previous.filter((item) => item !== id), id],
		);
	}, []);
	const open = useCallback(
		(id: string) => {
			if (!WINDOW_IDS.includes(id as WindowId)) return;
			if (!search.current.open.includes(id))
				update({ open: [...search.current.open, id] });
			setMinimized((previous) => previous.filter((item) => item !== id));
			bringToFront(id);
		},
		[update, bringToFront],
	);
	const close = useCallback(
		(id: string) => {
			update({
				open: search.current.open.filter((item) => item !== id),
				maximized: search.current.maximized.filter((item) => item !== id),
				...(id === "fileViewer" ? { file: undefined } : {}),
			});
			setZOrder((previous) => previous.filter((item) => item !== id));
			setMinimized((previous) => previous.filter((item) => item !== id));
		},
		[update],
	);
	const setOpenFile = useCallback(
		(id: string | undefined) => {
			if (!id) {
				close("fileViewer");
				return;
			}
			update({
				file: id,
				open: [...new Set([...search.current.open, "fileViewer"])],
			});
			setMinimized((previous) =>
				previous.filter((item) => item !== "fileViewer"),
			);
			bringToFront("fileViewer");
		},
		[update, close, bringToFront],
	);
	const setOpenFolder = useCallback(
		(id: string) => {
			update({
				folder: id,
				open: [...new Set([...search.current.open, "finder"])],
			});
			setMinimized((previous) => previous.filter((item) => item !== "finder"));
			bringToFront("finder");
		},
		[update, bringToFront],
	);
	// Keep the live stack authoritative; Set would preserve the original open order.
	const order = [
		...openWindows.filter((id) => !zOrder.includes(id)),
		...zOrder.filter((id) => openWindows.includes(id)),
	];
	return (
		<Context.Provider
			value={{
				isOpen: (id) => openWindows.includes(id),
				open,
				close,
				bringToFront,
				getZIndex: (id) => 10 + order.indexOf(id),
				activeWindow: order.filter((id) => !minimized.includes(id)).at(-1),
				isMaximized: (id) => maximizedWindows.includes(id),
				toggleMaximized: (id) => {
					update({
						maximized: search.current.maximized.includes(id)
							? search.current.maximized.filter((item) => item !== id)
							: [...search.current.maximized, id],
					});
					bringToFront(id);
				},
				isMinimized: (id) => minimized.includes(id),
				minimize: (id) =>
					setMinimized((previous) => [...new Set([...previous, id])]),
				openFile,
				setOpenFile,
				openFolder: openFolder ?? "home",
				setOpenFolder,
				frames,
				setFrame: (id, frame) =>
					setFrames((previous) => ({ ...previous, [id]: frame })),
			}}
		>
			{children}
		</Context.Provider>
	);
}

export function useWindowManager() {
	const context = useContext(Context);
	if (!context)
		throw new Error(
			"useWindowManager must be used within WindowManagerProvider",
		);
	return context;
}
