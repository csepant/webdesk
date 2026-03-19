import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useReducer,
	useRef,
} from "react";
import type { UseNavigateResult } from "@tanstack/react-router";

const WINDOW_IDS = [
	"about",
	"projects",
	"blog",
	"readme",
	"contact",
	"createFile",
	"fileViewer",
] as const;
export type WindowId = (typeof WINDOW_IDS)[number];

interface ZOrderState {
	zOrder: string[]; // stack order, last = top
}

type ZOrderAction =
	| { type: "BRING_TO_FRONT"; id: string }
	| { type: "REMOVE"; id: string };

const MAX_Z = 50;

function zOrderReducer(state: ZOrderState, action: ZOrderAction): ZOrderState {
	switch (action.type) {
		case "BRING_TO_FRONT": {
			const zOrder = [
				...state.zOrder.filter((id) => id !== action.id),
				action.id,
			];
			return { zOrder };
		}
		case "REMOVE": {
			return { zOrder: state.zOrder.filter((id) => id !== action.id) };
		}
		default:
			return state;
	}
}

interface WindowManagerContextValue {
	isOpen: (id: string) => boolean;
	open: (id: string) => void;
	close: (id: string) => void;
	toggle: (id: string) => void;
	bringToFront: (id: string) => void;
	getZIndex: (id: string) => number;
	isMaximized: (id: string) => boolean;
	toggleMaximized: (id: string) => void;
	openFile: string | undefined;
	setOpenFile: (fileName: string | undefined) => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
	null,
);

interface WindowManagerProviderProps {
	children: ReactNode;
	openWindows: string[];
	maximizedWindows: string[];
	openFile: string | undefined;
	navigate: UseNavigateResult<string>;
}

export function WindowManagerProvider({
	children,
	openWindows,
	maximizedWindows,
	openFile,
	navigate,
}: WindowManagerProviderProps) {
	const [state, dispatch] = useReducer(zOrderReducer, { zOrder: [] });

	const openSet = useMemo(() => new Set(openWindows), [openWindows]);
	const maximizedSet = useMemo(
		() => new Set(maximizedWindows),
		[maximizedWindows],
	);

	// Use refs to avoid stale closures in callbacks
	const openWindowsRef = useRef(openWindows);
	openWindowsRef.current = openWindows;
	const maximizedWindowsRef = useRef(maximizedWindows);
	maximizedWindowsRef.current = maximizedWindows;
	const openFileRef = useRef(openFile);
	openFileRef.current = openFile;

	const updateSearch = useCallback(
		(updates: {
			open?: string[];
			maximized?: string[];
			file?: string | undefined;
		}) => {
			navigate({
				search: (prev: Record<string, unknown>) => ({
					...prev,
					...updates,
				}),
			});
		},
		[navigate],
	);

	const isOpen = useCallback((id: string) => openSet.has(id), [openSet]);

	const open = useCallback(
		(id: string) => {
			const current = openWindowsRef.current;
			if (!current.includes(id)) {
				updateSearch({ open: [...current, id] });
			}
			dispatch({ type: "BRING_TO_FRONT", id });
		},
		[updateSearch],
	);

	const close = useCallback(
		(id: string) => {
			const current = openWindowsRef.current;
			const currentMaximized = maximizedWindowsRef.current;
			updateSearch({
				open: current.filter((w) => w !== id),
				maximized: currentMaximized.filter((w) => w !== id),
			});
			dispatch({ type: "REMOVE", id });
		},
		[updateSearch],
	);

	const toggle = useCallback(
		(id: string) => {
			if (openSet.has(id)) {
				close(id);
			} else {
				open(id);
			}
		},
		[openSet, open, close],
	);

	const bringToFront = useCallback(
		(id: string) => dispatch({ type: "BRING_TO_FRONT", id }),
		[],
	);

	const getZIndex = useCallback(
		(id: string) => {
			const index = state.zOrder.indexOf(id);
			if (index === -1) return 1;
			return Math.min(index + 2, MAX_Z);
		},
		[state.zOrder],
	);

	const isMaximized = useCallback(
		(id: string) => maximizedSet.has(id),
		[maximizedSet],
	);

	const toggleMaximized = useCallback(
		(id: string) => {
			const current = maximizedWindowsRef.current;
			if (current.includes(id)) {
				updateSearch({ maximized: current.filter((w) => w !== id) });
			} else {
				updateSearch({ maximized: [...current, id] });
			}
		},
		[updateSearch],
	);

	const setOpenFile = useCallback(
		(fileName: string | undefined) => {
			if (fileName) {
				const current = openWindowsRef.current;
				updateSearch({
					file: fileName,
					open: current.includes("fileViewer")
						? current
						: [...current, "fileViewer"],
				});
				dispatch({ type: "BRING_TO_FRONT", id: "fileViewer" });
			} else {
				const current = openWindowsRef.current;
				const currentMaximized = maximizedWindowsRef.current;
				updateSearch({
					file: undefined,
					open: current.filter((w) => w !== "fileViewer"),
					maximized: currentMaximized.filter((w) => w !== "fileViewer"),
				});
				dispatch({ type: "REMOVE", id: "fileViewer" });
			}
		},
		[updateSearch],
	);

	return (
		<WindowManagerContext.Provider
			value={{
				isOpen,
				open,
				close,
				toggle,
				bringToFront,
				getZIndex,
				isMaximized,
				toggleMaximized,
				openFile,
				setOpenFile,
			}}
		>
			{children}
		</WindowManagerContext.Provider>
	);
}

export function useWindowManager() {
	const ctx = useContext(WindowManagerContext);
	if (!ctx)
		throw new Error(
			"useWindowManager must be used within WindowManagerProvider",
		);
	return ctx;
}
