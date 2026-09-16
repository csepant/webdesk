import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Check,
	ChevronRight,
	Command,
	FileText,
	Folder,
	Mail,
	Search,
	SlidersHorizontal,
	Sun,
	Trash2,
	UserRound,
	Wifi,
	X,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import DesktopFileIcon from "@/components/File";
import { FileIcon } from "@/components/FileIcon";
import { Modal } from "@/components/Modal";
import { ContactWindow } from "@/components/windows/ContactWindow";
import { FileViewerWindow } from "@/components/windows/FileViewerWindow";
import { FinderWindow } from "@/components/windows/FinderWindow";
import {
	ContextMenuProvider,
	useContextMenu,
} from "@/contexts/ContextMenuContext";
import {
	FileSystemProvider,
	useFileSystem,
} from "@/contexts/FileSystemContext";
import {
	useWindowManager,
	WINDOW_IDS,
	WindowManagerProvider,
} from "@/contexts/WindowManagerContext";
import { type DesktopFile, isInTrash } from "@/lib/fileSystem";

const windowIds = (value: unknown, fallback: string[] = []) =>
	(Array.isArray(value)
		? value
		: typeof value === "string"
			? [value]
			: fallback
	).filter(
		(id): id is string =>
			typeof id === "string" &&
			WINDOW_IDS.includes(id as (typeof WINDOW_IDS)[number]),
	);
export const Route = createFileRoute("/")({
	component: App,
	validateSearch: (search: Record<string, unknown>) => ({
		open: windowIds(search.open, ["finder"]),
		maximized: windowIds(search.maximized),
		file: typeof search.file === "string" ? search.file : undefined,
		folder: typeof search.folder === "string" ? search.folder : undefined,
	}),
});
function App() {
	const { open, maximized, file, folder } = Route.useSearch();
	const navigate = Route.useNavigate();
	return (
		<WindowManagerProvider
			openWindows={open}
			maximizedWindows={maximized}
			openFile={file}
			openFolder={folder}
			navigate={navigate}
		>
			<FileSystemProvider>
				<ContextMenuProvider>
					<Desktop />
				</ContextMenuProvider>
			</FileSystemProvider>
		</WindowManagerProvider>
	);
}

function DockItem({
	label,
	children,
	onClick,
	running,
	className,
}: {
	label: string;
	children: ReactNode;
	onClick: () => void;
	running?: boolean;
	className: string;
}) {
	return (
		<button
			type="button"
			className={`dock-item ${className}`}
			aria-label={label}
			onClick={onClick}
		>
			<span className="dock-tooltip">{label}</span>
			<span className="dock-icon">{children}</span>
			<span className={`dock-indicator ${running ? "running" : ""}`} />
		</button>
	);
}

function Desktop() {
	const ribbonId = useId();
	const { showContextMenu } = useContextMenu();
	const desktopRef = useRef<HTMLDivElement>(null);
	const wm = useWindowManager();
	const fs = useFileSystem();
	const [time, setTime] = useState<Date>();
	const [menu, setMenu] = useState<string | null>(null);
	const [wallpaper, setWallpaper] = useState("dawn");
	const [spotlight, setSpotlight] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedResult, setSelectedResult] = useState(0);
	const spotlightRef = useRef<HTMLInputElement>(null);
	const menuRef = useRef<HTMLElement>(null);
	useEffect(() => {
		const update = () => setTime(new Date());
		update();
		const timer = setInterval(update, 1000 * 30);
		return () => clearInterval(timer);
	}, []);
	useEffect(() => {
		if (spotlight) spotlightRef.current?.focus();
	}, [spotlight]);
	useEffect(() => {
		const keyboard = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				setSpotlight((value) => !value);
			}
			if (event.key === "Escape") {
				setSpotlight(false);
				setMenu(null);
			}
		};
		const outside = (event: PointerEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenu(null);
		};
		document.addEventListener("keydown", keyboard);
		document.addEventListener("pointerdown", outside);
		return () => {
			document.removeEventListener("keydown", keyboard);
			document.removeEventListener("pointerdown", outside);
		};
	}, []);
	const openItem = (file: DesktopFile) => {
		if (file.type === "directory") wm.setOpenFolder(file.id);
		else if (file.type === "app") wm.open(file.appComponent ?? "contact");
		else wm.setOpenFile(file.id);
		setSpotlight(false);
		setQuery("");
	};
	const results = fs.files
		.filter(
			(file) =>
				!isInTrash(file, fs.files) &&
				file.name.toLowerCase().includes(query.toLowerCase()),
		)
		.slice(0, 7);
	const menus: Record<
		string,
		{ label: string; action: () => void; shortcut?: string }[]
	> = {
		Cris: [
			{ label: "About Cris", action: () => wm.setOpenFile("about") },
			{ label: "About this desktop", action: () => wm.setOpenFile("readme") },
		],
		File: [
			{ label: "Open Finder", action: () => wm.open("finder") },
			{ label: "Open Documents", action: () => wm.setOpenFolder("documents") },
			{ label: "Get in touch", action: () => wm.open("contact") },
		],
		View: [
			{
				label: "Show desktop",
				action: () =>
					WINDOW_IDS.forEach((id) => {
						if (wm.isOpen(id)) wm.minimize(id);
					}),
			},
			{
				label: "Search this Mac…",
				action: () => setSpotlight(true),
				shortcut: "⌘ K",
			},
		],
		Go: [
			{ label: "Home", action: () => wm.setOpenFolder("home") },
			{ label: "Projects", action: () => wm.setOpenFolder("projects") },
			{ label: "Writing", action: () => wm.setOpenFolder("writing") },
			{ label: "Documents", action: () => wm.setOpenFolder("documents") },
			{ label: "Trash", action: () => wm.setOpenFolder("trash") },
		],
		Window: [
			{ label: "Bring Finder to front", action: () => wm.open("finder") },
			...(wm.activeWindow
				? [
						{
							label: "Minimize window",
							action: () => wm.activeWindow && wm.minimize(wm.activeWindow),
						},
						{
							label: "Zoom window",
							action: () =>
								wm.activeWindow && wm.toggleMaximized(wm.activeWindow),
						},
					]
				: []),
		],
		Help: [{ label: "A quick tour", action: () => wm.setOpenFile("readme") }],
	};
	return (
		<main
			className={`desktop wallpaper-${wallpaper}`}
			onContextMenu={(event) => {
				if (
					(event.target as HTMLElement).closest(
						".desktop-window, .dock, .menu-bar, dialog",
					)
				)
					return;
				setMenu(null);
				showContextMenu(event, "Desktop actions", [
					{
						label: "Open Finder",
						icon: <Folder size={15} />,
						onSelect: () => wm.setOpenFolder("home"),
					},
					{
						label: "Show desktop",
						onSelect: () =>
							WINDOW_IDS.forEach((id) => {
								if (wm.isOpen(id)) wm.minimize(id);
							}),
					},
					{
						label: "Search this Mac…",
						icon: <Search size={15} />,
						onSelect: () => setSpotlight(true),
						separatorBefore: true,
					},
					{
						label: "Change wallpaper…",
						icon: <SlidersHorizontal size={15} />,
						onSelect: () => setMenu("appearance"),
					},
					{
						label: "About this desktop",
						onSelect: () => wm.setOpenFile("readme"),
						separatorBefore: true,
					},
				]);
			}}
		>
			<div className="wallpaper" aria-hidden="true">
				<div className="wallpaper-glow" />
				<svg
					aria-hidden="true"
					viewBox="0 0 1440 1000"
					preserveAspectRatio="xMidYMid slice"
				>
					<defs>
						<linearGradient id={`${ribbonId}-1`} x1="0" y1="0" x2="1" y2="1">
							<stop stopColor="#d398ba" />
							<stop offset=".46" stopColor="#ac95c4" />
							<stop offset="1" stopColor="#606da5" />
						</linearGradient>
						<linearGradient id={`${ribbonId}-2`} x1="0" y1="0" x2=".7" y2="1">
							<stop stopColor="#efb29f" />
							<stop offset=".5" stopColor="#ca8fbc" />
							<stop offset="1" stopColor="#7274b0" />
						</linearGradient>
						<linearGradient id={`${ribbonId}-3`} x1="0" y1="0" x2="1" y2="1">
							<stop stopColor="#fbd6b9" />
							<stop offset=".45" stopColor="#dda6b8" />
							<stop offset="1" stopColor="#9e8fc2" />
						</linearGradient>
					</defs>
					<path
						d="M-200 660C100 40 565 10 670 285S1000 780 1640 270L1700 1100H-200Z"
						fill={`url(#${ribbonId}-1)`}
					/>
					<path
						d="M-220 1000C-30 530 480 150 650 400S1010 950 1640 480L1650 1150H-220Z"
						fill={`url(#${ribbonId}-2)`}
					/>
					<path
						d="M-150 1160C110 660 530 390 700 600S1110 1090 1640 790L1700 1200Z"
						fill={`url(#${ribbonId}-3)`}
					/>
				</svg>
			</div>
			<header className="menu-bar" ref={menuRef}>
				<nav className="menu-left" aria-label="Desktop menu">
					{Object.entries(menus).map(([label, entries]) => (
						<div
							className={`menu-container ${label === "Cris" ? "brand-menu" : ""}`}
							key={label}
						>
							<button
								type="button"
								className={`menu-button ${menu === label ? "selected" : ""}`}
								aria-label={label === "Cris" ? "Desktop menu" : `${label} menu`}
								aria-expanded={menu === label}
								onClick={() => setMenu(menu === label ? null : label)}
							>
								{label === "Cris" ? (
									<Command size={17} strokeWidth={2.4} />
								) : (
									label
								)}
							</button>
							{label === "Cris" && (
								<strong className="active-app">
									{wm.activeWindow === "contact"
										? "Mail"
										: wm.activeWindow === "fileViewer"
											? "Preview"
											: "Finder"}
								</strong>
							)}
							{menu === label && (
								<div className="popover menu-popover">
									{entries.map((item) => (
										<button
											type="button"
											key={item.label}
											onClick={() => {
												item.action();
												setMenu(null);
											}}
										>
											<span>{item.label}</span>
											{item.shortcut && <small>{item.shortcut}</small>}
										</button>
									))}
								</div>
							)}
						</div>
					))}
				</nav>
				<div className="menu-right">
					<span className="menu-location">Santiago, CL</span>
					<Wifi className="wifi-icon" size={15} aria-label="Personal desktop" />
					<button
						type="button"
						className="menu-button"
						aria-label="Search desktop"
						onClick={() => setSpotlight(true)}
					>
						<Search size={15} />
					</button>
					<div className="menu-container">
						<button
							type="button"
							className="menu-button"
							aria-label="Appearance"
							aria-expanded={menu === "appearance"}
							onClick={() =>
								setMenu(menu === "appearance" ? null : "appearance")
							}
						>
							<SlidersHorizontal size={16} />
						</button>
						{menu === "appearance" && (
							<div className="popover appearance-popover">
								<h3>Make it yours</h3>
								<p>Choose a desktop mood.</p>
								<div className="wallpaper-options">
									{["dawn", "dusk", "midnight"].map((option) => (
										<button
											type="button"
											key={option}
											className={`wallpaper-swatch swatch-${option}`}
											aria-label={`${option} wallpaper`}
											aria-pressed={wallpaper === option}
											onClick={() => setWallpaper(option)}
										>
											{wallpaper === option && <Check size={18} />}
										</button>
									))}
								</div>
								<span>
									<Sun size={14} />A little change of scenery.
								</span>
							</div>
						)}
					</div>
					<time className="menu-time">
						{time?.toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
						})}
						<span>
							{time?.toLocaleTimeString("en-US", {
								hour: "numeric",
								minute: "2-digit",
							})}
						</span>
					</time>
				</div>
			</header>
			<div className="desktop-workspace" ref={desktopRef}>
				<div
					className={`desktop-intro ${wm.activeWindow ? "intro-hidden" : ""}`}
				>
					<span className="eyebrow">CRISTIAN SEPULVEDA</span>
					<h2>
						A little curious.
						<br />
						Always building.
					</h2>
					<p>A personal space on the internet.</p>
					<button type="button" onClick={() => wm.open("finder")}>
						Come on in <ArrowUpRight size={15} />
					</button>
				</div>
				{["projects", "writing", "documents", "readme"].map((id, index) => {
					const file = fs.getFile(id);
					return (
						file && (
							<DesktopFileIcon
								key={id}
								file={file}
								index={index}
								parentRef={desktopRef}
								onOpen={() => openItem(file)}
							/>
						)
					);
				})}
				<FinderWindow parentRef={desktopRef} />
				<FileViewerWindow parentRef={desktopRef} />
				<ContactWindow parentRef={desktopRef} />
			</div>
			<div className="desktop-caption">
				<span className="status-dot" /> Built with curiosity.{" "}
				<span>Made in Santiago.</span>
			</div>
			<nav className="dock" aria-label="Application Dock">
				<DockItem
					label="Finder"
					className="dock-finder"
					running={wm.isOpen("finder")}
					onClick={() => wm.open("finder")}
				>
					<span className="finder-face">
						<i />
						<b />
					</span>
				</DockItem>
				<DockItem
					label="About me"
					className="dock-about"
					running={wm.isOpen("fileViewer") && wm.openFile === "about"}
					onClick={() => wm.setOpenFile("about")}
				>
					<UserRound />
				</DockItem>
				<DockItem
					label="Projects"
					className="dock-projects"
					onClick={() => wm.setOpenFolder("projects")}
				>
					<Folder />
				</DockItem>
				<DockItem
					label="Writing"
					className="dock-notes"
					onClick={() => wm.setOpenFolder("writing")}
				>
					<span className="notes-lines" />
				</DockItem>
				<DockItem
					label="Mail"
					className="dock-mail"
					running={wm.isOpen("contact")}
					onClick={() => wm.open("contact")}
				>
					<Mail />
				</DockItem>
				{wm.isOpen("fileViewer") && wm.openFile !== "about" && (
					<DockItem
						label="Preview"
						className="dock-preview"
						running
						onClick={() => wm.open("fileViewer")}
					>
						<FileText />
					</DockItem>
				)}
				<span className="dock-divider" />
				<DockItem
					label="Trash"
					className="dock-trash"
					onClick={() => wm.setOpenFolder("trash")}
				>
					<Trash2 />
				</DockItem>
			</nav>
			{spotlight && (
				<Modal
					className="spotlight"
					label="Search desktop"
					onClose={() => setSpotlight(false)}
				>
					<div className="spotlight-input">
						<Search size={24} />
						<input
							ref={spotlightRef}
							aria-label="Spotlight search"
							placeholder="Search files, folders, and a little inspiration…"
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								setSelectedResult(0);
							}}
							onKeyDown={(event) => {
								if (event.key === "ArrowDown" || event.key === "ArrowUp") {
									event.preventDefault();
									setSelectedResult((index) =>
										Math.max(
											0,
											Math.min(
												results.length - 1,
												index + (event.key === "ArrowDown" ? 1 : -1),
											),
										),
									);
								}
								if (event.key === "Enter" && results[selectedResult])
									openItem(results[selectedResult]);
							}}
						/>
						<button
							type="button"
							aria-label="Close search"
							onClick={() => setSpotlight(false)}
						>
							<X size={18} />
						</button>
					</div>
					<p className="spotlight-label">
						{query ? "RESULTS" : "EXPLORE THIS DESKTOP"}
					</p>
					{results.length ? (
						results.map((file, index) => (
							<button
								type="button"
								key={file.id}
								className={`spotlight-result ${index === selectedResult ? "selected" : ""}`}
								onClick={() => openItem(file)}
							>
								<FileIcon file={file} small />
								<span>{file.name}</span>
								<ChevronRight size={14} />
							</button>
						))
					) : (
						<p className="spotlight-empty">
							No matching files. Try another name.
						</p>
					)}
					<footer>
						<span>↑ ↓ to navigate</span>
						<span>↵ to open</span>
						<span>esc to close</span>
					</footer>
				</Modal>
			)}
		</main>
	);
}
