import {
	ArrowDownUp,
	ChevronLeft,
	ChevronRight,
	Code2,
	FilePlus2,
	Folder,
	FolderPlus,
	Grid2X2,
	HardDrive,
	Home,
	List,
	Monitor,
	MoreHorizontal,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { FileIcon } from "@/components/FileIcon";
import { Modal } from "@/components/Modal";
import Window from "@/components/Window";
import {
	type ContextMenuItem,
	useContextMenu,
} from "@/contexts/ContextMenuContext";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { canMove, type DesktopFile, isInTrash } from "@/lib/fileSystem";

export function FinderWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const wm = useWindowManager();
	const { showContextMenu } = useContextMenu();
	const fs = useFileSystem();
	const folderId = wm.openFolder;
	const [view, setView] = useState<"grid" | "list">("grid");
	const [query, setQuery] = useState("");
	const [selection, setSelection] = useState<string>();
	const [menu, setMenu] = useState(false);
	const [modal, setModal] = useState<
		"file" | "directory" | "rename" | "move" | null
	>(null);
	const [name, setName] = useState("");
	const [destination, setDestination] = useState("home");
	const [error, setError] = useState("");
	const [sort, setSort] = useState<"name" | "date">("name");
	const [history, setHistory] = useState({ paths: [folderId], index: 0 });
	const searchRef = useRef<HTMLInputElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const nameRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (modal) {
			nameRef.current?.focus();
			nameRef.current?.select();
		}
	}, [modal]);
	useEffect(() => {
		setHistory((previous) =>
			previous.paths[previous.index] === folderId
				? previous
				: {
						paths: [...previous.paths.slice(0, previous.index + 1), folderId],
						index: previous.index + 1,
					},
		);
		setSelection(undefined);
		setQuery("");
		setMenu(false);
		setError("");
	}, [folderId]);
	useEffect(() => {
		if (!menu) return;
		const dismiss = (event: PointerEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
		};
		document.addEventListener("pointerdown", dismiss);
		return () => document.removeEventListener("pointerdown", dismiss);
	}, [menu]);
	const currentFolder = fs.getFile(folderId);
	const validFolder =
		folderId === "home" ||
		folderId === "trash" ||
		Boolean(
			currentFolder?.type === "directory" &&
				!isInTrash(currentFolder, fs.files),
		);
	const inTrash = folderId === "trash";
	const selected = selection ? fs.getFile(selection) : undefined;
	const searching = Boolean(query.trim());
	const visible = fs.files
		.filter((file) =>
			inTrash
				? file.deleted
				: !isInTrash(file, fs.files) &&
					(searching
						? file.name.toLowerCase().includes(query.trim().toLowerCase())
						: file.parentId === folderId),
		)
		.sort((a, b) => {
			if (sort === "date") return b.updatedAt.localeCompare(a.updatedAt);
			return (
				(b.type === "directory" ? 1 : 0) - (a.type === "directory" ? 1 : 0) ||
				a.name.localeCompare(b.name)
			);
		});
	const folderName = inTrash
		? "Trash"
		: folderId === "home"
			? "Cris's Mac"
			: (currentFolder?.name ?? "Folder not found");
	const ancestors: DesktopFile[] = [];
	let ancestor = currentFolder;
	const visited = new Set<string>();
	while (ancestor && !visited.has(ancestor.id)) {
		ancestors.unshift(ancestor);
		visited.add(ancestor.id);
		ancestor = fs.getFile(ancestor.parentId);
	}
	const navigate = (id: string) => wm.setOpenFolder(id);
	const openItem = (file: DesktopFile) => {
		if (inTrash) return;
		if (file.type === "directory") navigate(file.id);
		else if (file.type === "app") wm.open(file.appComponent ?? "contact");
		else wm.setOpenFile(file.id);
	};
	const goHistory = (direction: number) => {
		const next = history.index + direction;
		if (next < 0 || next >= history.paths.length) return;
		setHistory((previous) => ({ ...previous, index: next }));
		navigate(history.paths[next]);
	};
	const run = (action: () => void) => {
		try {
			action();
			setError("");
			setMenu(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong.");
		}
	};
	const begin = (action: typeof modal, target = selected) => {
		if (target) setSelection(target.id);
		setModal(action);
		setName(
			action === "rename"
				? (target?.name ?? "")
				: action === "file"
					? "Untitled.md"
					: "Untitled folder",
		);
		setDestination("home");
		setError("");
		setMenu(false);
	};
	const contextItems = (file?: DesktopFile): ContextMenuItem[] => {
		if (file)
			return inTrash
				? [
						{
							label: "Put back",
							icon: <RotateCcw size={15} />,
							onSelect: () =>
								run(() => {
									fs.restore(file.id);
									setSelection(undefined);
								}),
						},
					]
				: [
						{ label: "Open", onSelect: () => openItem(file) },
						{
							label: "Show enclosing folder",
							icon: <Folder size={15} />,
							onSelect: () => navigate(file.parentId),
						},
						...(file.local
							? [
									{
										label: "Rename…",
										icon: <Pencil size={15} />,
										onSelect: () => begin("rename", file),
										separatorBefore: true,
									},
									{ label: "Move to…", onSelect: () => begin("move", file) },
									{
										label: "Move to Trash",
										icon: <Trash2 size={15} />,
										onSelect: () =>
											run(() => {
												fs.trash(file.id);
												setSelection(undefined);
											}),
										separatorBefore: true,
									},
								]
							: []),
					];
		return [
			...(!inTrash && validFolder
				? [
						{
							label: "New folder",
							icon: <FolderPlus size={15} />,
							onSelect: () => begin("directory"),
						},
						{
							label: "New note",
							icon: <FilePlus2 size={15} />,
							onSelect: () => begin("file"),
						},
					]
				: []),
			{
				label: "View as icons",
				icon: <Grid2X2 size={15} />,
				onSelect: () => setView("grid"),
				separatorBefore: !inTrash && validFolder,
			},
			{
				label: "View as list",
				icon: <List size={15} />,
				onSelect: () => setView("list"),
			},
			{
				label: "Sort by name",
				onSelect: () => setSort("name"),
				separatorBefore: true,
			},
			{ label: "Sort by date", onSelect: () => setSort("date") },
		];
	};
	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		run(() => {
			if (modal === "rename" && selected) fs.rename(selected.id, name);
			else if (modal === "move" && selected) fs.move(selected.id, destination);
			else if (modal === "file" || modal === "directory")
				setSelection(fs.create(name, modal, folderId));
			setModal(null);
		});
	};
	return (
		<Window
			windowId="finder"
			title="Finder"
			parentRef={parentRef}
			content={
				<section
					className="finder"
					aria-label="File browser"
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							setModal(null);
							setMenu(false);
							setQuery("");
						}
						if ((event.metaKey || event.ctrlKey) && event.key === "f") {
							event.preventDefault();
							searchRef.current?.focus();
						}
					}}
				>
					<aside className="finder-sidebar">
						<button
							type="button"
							className="sidebar-profile"
							aria-label="About Cristian"
							onClick={() => wm.setOpenFile("about")}
						>
							<img src="/me.jpeg" alt="Cristian Sepulveda" />
							<span>
								<strong>Cristian Sepulveda</strong>
								<small>My personal space</small>
							</span>
						</button>
						<p className="sidebar-label">Favorites</p>
						{[
							{ id: "home", name: "Cris's Mac", icon: <Home /> },
							{ id: "projects", name: "Projects", icon: <Code2 /> },
							{ id: "writing", name: "Writing", icon: <Pencil /> },
							{ id: "documents", name: "Documents", icon: <Folder /> },
						].map((item) => (
							<button
								key={item.id}
								aria-label={item.name}
								type="button"
								className={`sidebar-item ${folderId === item.id ? "selected" : ""}`}
								onClick={() => navigate(item.id)}
							>
								{item.icon}
								<span>{item.name}</span>
							</button>
						))}
						<p className="sidebar-label locations-label">Locations</p>
						<button
							type="button"
							className="sidebar-item"
							aria-label="Desktop"
							onClick={() => navigate("home")}
						>
							<Monitor />
							<span>Desktop</span>
						</button>
						<button
							type="button"
							className={`sidebar-item ${inTrash ? "selected" : ""}`}
							aria-label="Trash"
							onClick={() => navigate("trash")}
						>
							<Trash2 />
							<span>Trash</span>
							{fs.files.filter((file) => file.deleted).length > 0 && (
								<small>{fs.files.filter((file) => file.deleted).length}</small>
							)}
						</button>
						<div className="sidebar-bottom">
							<span className="status-dot" /> A little curious. Always building.
							<span>Santiago, Chile</span>
						</div>
					</aside>
					<div className="finder-main">
						<div className="finder-toolbar">
							<div className="history-controls">
								<button
									type="button"
									className="icon-button"
									aria-label="Back"
									disabled={history.index === 0}
									onClick={() => goHistory(-1)}
								>
									<ChevronLeft size={18} />
								</button>
								<button
									type="button"
									className="icon-button"
									aria-label="Forward"
									disabled={history.index >= history.paths.length - 1}
									onClick={() => goHistory(1)}
								>
									<ChevronRight size={18} />
								</button>
							</div>
							<strong className="folder-title">{folderName}</strong>
							<div className="view-switch">
								<button
									type="button"
									aria-label="Icon view"
									aria-pressed={view === "grid"}
									className={view === "grid" ? "selected" : ""}
									onClick={() => setView("grid")}
								>
									<Grid2X2 size={15} />
								</button>
								<button
									type="button"
									aria-label="List view"
									aria-pressed={view === "list"}
									className={view === "list" ? "selected" : ""}
									onClick={() => setView("list")}
								>
									<List size={16} />
								</button>
							</div>
							<button
								type="button"
								className="icon-button sort-button"
								aria-label={`Sort by ${sort === "name" ? "date" : "name"}`}
								onClick={() => setSort(sort === "name" ? "date" : "name")}
							>
								<ArrowDownUp size={15} />
							</button>
							<div className="finder-actions" ref={menuRef}>
								<button
									type="button"
									className="icon-button"
									aria-label="File actions"
									aria-expanded={menu}
									onClick={() => setMenu(!menu)}
								>
									{selected ? <MoreHorizontal size={20} /> : <Plus size={19} />}
								</button>
								{menu && (
									<div className="popover file-actions-menu">
										{!inTrash && validFolder && (
											<>
												<button
													type="button"
													onClick={() => begin("directory")}
												>
													<FolderPlus size={15} />
													New folder
												</button>
												<button type="button" onClick={() => begin("file")}>
													<FilePlus2 size={15} />
													New note
												</button>
											</>
										)}
										{selected && !inTrash && (
											<button
												type="button"
												onClick={() => {
													openItem(selected);
													setMenu(false);
												}}
											>
												Open
											</button>
										)}
										{selected?.local &&
											(inTrash ? (
												<button
													type="button"
													onClick={() =>
														run(() => {
															fs.restore(selected.id);
															setSelection(undefined);
														})
													}
												>
													<RotateCcw size={15} />
													Put back
												</button>
											) : (
												<>
													<hr />
													<button type="button" onClick={() => begin("rename")}>
														Rename…
													</button>
													<button type="button" onClick={() => begin("move")}>
														Move to…
													</button>
													<button
														type="button"
														onClick={() =>
															run(() => {
																fs.trash(selected.id);
																setSelection(undefined);
															})
														}
													>
														<Trash2 size={15} />
														Move to Trash
													</button>
												</>
											))}
										{inTrash && !selected && (
											<span className="menu-hint">
												Select an item to restore it.
											</span>
										)}
									</div>
								)}
							</div>
						</div>
						<div className="finder-search-row">
							<label className="finder-search">
								<Search size={14} />
								<input
									ref={searchRef}
									aria-label="Search files"
									placeholder="Search this Mac"
									value={query}
									disabled={inTrash}
									onChange={(event) => {
										setQuery(event.target.value);
										setSelection(undefined);
									}}
								/>
								{query && (
									<button
										type="button"
										aria-label="Clear search"
										onClick={() => setQuery("")}
									>
										<X size={13} />
									</button>
								)}
							</label>
							<span>{searching ? "All files" : "A place for everything."}</span>
						</div>
						<section
							aria-label="Folder contents"
							className="finder-scroll"
							onContextMenu={(event) => {
								if (
									(event.target as HTMLElement).closest(
										"button, input, textarea",
									)
								)
									return;
								setSelection(undefined);
								setMenu(false);
								showContextMenu(event, "Folder actions", contextItems());
							}}
						>
							{folderId === "home" && !searching && (
								<div className="finder-welcome">
									<div className="eyebrow">HELLO, WORLD</div>
									<h1>
										Make yourself at home<span>.</span>
									</h1>
									<p>
										I'm Cris — a developer, tinkerer, and curious human.
										<br />
										Here's a little of what I do, think, and build.
									</p>
									<span className="welcome-sticker" aria-hidden="true">
										✳
									</span>
								</div>
							)}
							<div className="file-section-heading">
								<span>
									{searching
										? "Search results"
										: inTrash
											? "Recently removed"
											: folderId === "home"
												? "A little bit of everything"
												: "Files & folders"}
								</span>
								<span>{visible.length} items</span>
							</div>
							{!validFolder ? (
								<div className="empty-folder">
									<Folder size={38} />
									<h2>This folder isn't available</h2>
									<button
										type="button"
										className="primary-button"
										onClick={() => navigate("home")}
									>
										Back to Cris's Mac
									</button>
								</div>
							) : visible.length === 0 ? (
								<div className="empty-folder">
									{inTrash ? (
										<Trash2 size={38} />
									) : searching ? (
										<Search size={38} />
									) : (
										<Folder size={38} />
									)}
									<h2>
										{inTrash
											? "All clear."
											: searching
												? "No matching files"
												: "Room for something new."}
									</h2>
									<p>
										{inTrash
											? "Files you remove will appear here."
											: searching
												? "Try another name or a shorter search."
												: "Create a folder or note with the + button."}
									</p>
								</div>
							) : (
								<div className={`files-${view}`}>
									{view === "list" && (
										<div className="file-list-heading">
											<span>Name</span>
											<span>Kind</span>
											<span>Modified</span>
										</div>
									)}
									{visible.map((file) => (
										<button
											type="button"
											key={file.id}
											className={`file-item ${selection === file.id ? "selected" : ""}`}
											aria-label={file.name}
											aria-pressed={selection === file.id}
											onClick={(event) => {
												setSelection(file.id);
												if (event.detail === 0) openItem(file);
											}}
											onDoubleClick={() => openItem(file)}
											onPointerUp={(event) => {
												if (event.pointerType === "touch") {
													setSelection(file.id);
													openItem(file);
												}
											}}
											onContextMenu={(event) => {
												setSelection(file.id);
												setMenu(false);
												showContextMenu(
													event,
													`${file.name} actions`,
													contextItems(file),
												);
											}}
											onKeyDown={(event) => {
												if (
													[
														"ArrowRight",
														"ArrowDown",
														"ArrowLeft",
														"ArrowUp",
													].includes(event.key)
												) {
													event.preventDefault();
													const delta =
														event.key === "ArrowRight" ||
														event.key === "ArrowDown"
															? 1
															: -1;
													const next =
														visible[
															(visible.indexOf(file) + delta + visible.length) %
																visible.length
														];
													setSelection(next.id);
													const buttons =
														event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
															"button.file-item",
														);
													buttons?.[
														(visible.indexOf(file) + delta + visible.length) %
															visible.length
													]?.focus();
												}
											}}
										>
											<FileIcon file={file} small={view === "list"} />
											<span className="file-name">{file.name}</span>
											<span className="file-kind">
												{file.type === "directory"
													? `${fs.files.filter((child) => child.parentId === file.id && !child.deleted).length} items`
													: file.type === "app"
														? "Application"
														: "Markdown"}
											</span>
											{view === "list" && (
												<span className="file-date">
													{new Date(file.updatedAt).toLocaleDateString(
														"en-US",
														{ month: "short", day: "numeric", timeZone: "UTC" },
													)}
												</span>
											)}
										</button>
									))}
								</div>
							)}
						</section>
						{(error || fs.storageError || fs.cloudError) && (
							<p className="inline-error" aria-live="polite">
								{error || fs.storageError || fs.cloudError}
							</p>
						)}
						<footer className="finder-status">
							<div className="breadcrumbs">
								<HardDrive size={13} />
								<button type="button" onClick={() => navigate("home")}>
									Cris's Mac
								</button>
								{inTrash ? (
									<>
										<ChevronRight size={12} />
										<span>Trash</span>
									</>
								) : (
									ancestors.map((item) => (
										<span key={item.id}>
											<ChevronRight size={12} />
											<button type="button" onClick={() => navigate(item.id)}>
												{item.name}
											</button>
										</span>
									))
								)}
							</div>
							<span>
								{selected?.local
									? "Saved in this browser"
									: fs.loading
										? "Loading folders…"
										: `${visible.length} items${selection ? ", 1 selected" : ""}`}
							</span>
						</footer>
					</div>
					{modal && (
						<Modal
							className="finder-sheet"
							onClose={() => {
								setModal(null);
								setError("");
							}}
							label={
								modal === "rename"
									? "Rename item"
									: modal === "move"
										? "Move item"
										: `New ${modal === "file" ? "note" : "folder"}`
							}
						>
							<FolderPlus size={32} />
							<h2>
								{modal === "rename"
									? "A new name"
									: modal === "move"
										? "Choose a folder"
										: modal === "file"
											? "A fresh page."
											: "A little more organized."}
							</h2>
							<p>
								{modal === "rename"
									? "Give this item a new name."
									: "Your workspace is saved in this browser."}
							</p>
							<form onSubmit={submit}>
								{modal === "move" ? (
									<select
										aria-label="Destination folder"
										value={destination}
										onChange={(event) => setDestination(event.target.value)}
									>
										<option value="home">Cris's Mac</option>
										{fs.files
											.filter(
												(file) =>
													file.type === "directory" &&
													selected &&
													canMove(selected, file.id, fs.files),
											)
											.map((file) => (
												<option key={file.id} value={file.id}>
													{file.name}
												</option>
											))}
									</select>
								) : (
									<input
										ref={nameRef}
										aria-label="Name"
										value={name}
										onChange={(event) => setName(event.target.value)}
										required
										maxLength={100}
									/>
								)}
								{error && (
									<p className="inline-error" role="alert">
										{error}
									</p>
								)}
								<div className="sheet-buttons">
									<button
										type="button"
										className="secondary-button"
										onClick={() => {
											setModal(null);
											setError("");
										}}
									>
										Cancel
									</button>
									<button type="submit" className="primary-button">
										{modal === "rename"
											? "Rename"
											: modal === "move"
												? "Move"
												: "Create"}
									</button>
								</div>
							</form>
						</Modal>
					)}
				</section>
			}
		/>
	);
}
