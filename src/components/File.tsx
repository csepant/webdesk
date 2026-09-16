import { type RefObject, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { FileIcon } from "@/components/FileIcon";
import { useContextMenu } from "@/contexts/ContextMenuContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import type { DesktopFile } from "@/lib/fileSystem";

export default function DesktopFileIcon({
	file,
	index,
	parentRef,
	onOpen,
}: {
	file: DesktopFile;
	index: number;
	parentRef: RefObject<HTMLDivElement | null>;
	onOpen: () => void;
}) {
	const { showContextMenu } = useContextMenu();
	const wm = useWindowManager();
	const [bounds, setBounds] = useState({ width: 1100, height: 720 });
	const [position, setPosition] = useState<{ x: number; y: number }>();
	const moved = useRef(false);
	useEffect(() => {
		const parent = parentRef.current;
		if (!parent) return;
		const observer = new ResizeObserver(() =>
			setBounds({ width: parent.clientWidth, height: parent.clientHeight }),
		);
		observer.observe(parent);
		try {
			const saved = JSON.parse(
				localStorage.getItem(`cris-desktop-icon-${file.id}`) ?? "null",
			);
			if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))
				setPosition(saved);
		} catch {
			/* Icon placement is optional when browser storage is unavailable. */
		}
		return () => observer.disconnect();
	}, [file.id, parentRef]);
	const mobile = bounds.width < 640;
	const width = mobile ? 80 : 99;
	const height = 100;
	const x = Math.max(
		0,
		Math.min(position?.x ?? bounds.width - width - 14, bounds.width - width),
	);
	const y = Math.max(
		0,
		Math.min(position?.y ?? 15 + index * 114, bounds.height - height),
	);
	return (
		<Rnd
			size={{ width, height }}
			position={{ x, y }}
			bounds="parent"
			enableResizing={false}
			dragGrid={[10, 10]}
			style={{ zIndex: 1 }}
			onDragStart={() => {
				moved.current = false;
			}}
			onDrag={() => {
				moved.current = true;
			}}
			onDragStop={(_, data) => {
				if (!moved.current) return;
				const next = { x: data.x, y: data.y };
				setPosition(next);
				try {
					localStorage.setItem(
						`cris-desktop-icon-${file.id}`,
						JSON.stringify(next),
					);
				} catch {
					/* Keep session placement. */
				}
			}}
		>
			<button
				type="button"
				className="desktop-file"
				style={{ width: "100%", height: "100%" }}
				aria-label={file.name}
				onContextMenu={(event) =>
					showContextMenu(event, `${file.name} actions`, [
						{ label: "Open", onSelect: onOpen },
						{
							label: "Show in Finder",
							onSelect: () => wm.setOpenFolder(file.parentId),
						},
					])
				}
				onDoubleClick={() => {
					if (!moved.current) onOpen();
				}}
				onClick={(event) => {
					if (event.detail === 0) onOpen();
				}}
				onPointerUp={(event) => {
					if (event.pointerType === "touch" && !moved.current) onOpen();
				}}
			>
				<FileIcon file={file} />
				<span>{file.type === "directory" ? file.name : "Read me"}</span>
			</button>
		</Rnd>
	);
}
