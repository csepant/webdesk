import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useContextMenu } from "@/contexts/ContextMenuContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { fitFrame, initialFrame } from "@/lib/windowGeometry";

export default function Window({
	title,
	content,
	parentRef,
	windowId,
	toolbar,
}: {
	title: string;
	content: ReactNode;
	parentRef: RefObject<HTMLDivElement | null>;
	windowId: string;
	toolbar?: ReactNode;
}) {
	const manager = useWindowManager();
	const { showContextMenu } = useContextMenu();
	const [bounds, setBounds] = useState({ width: 1100, height: 720 });
	useEffect(() => {
		const parent = parentRef.current;
		if (!parent) return;
		const measure = () =>
			setBounds({ width: parent.clientWidth, height: parent.clientHeight });
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(parent);
		return () => observer.disconnect();
	}, [parentRef]);
	if (!manager.isOpen(windowId)) return null;
	const mobile = bounds.width < 640;
	const maximized = manager.isMaximized(windowId);
	const frame = fitFrame(
		manager.frames[windowId] ?? initialFrame(windowId, bounds),
		bounds,
	);
	const displayed = maximized || mobile ? { x: 0, y: 0, ...bounds } : frame;
	return (
		<Rnd
			data-window-id={windowId}
			className={`desktop-window ${manager.activeWindow === windowId ? "is-active" : "is-inactive"}`}
			size={{ width: displayed.width, height: displayed.height }}
			position={{ x: displayed.x, y: displayed.y }}
			bounds="parent"
			minWidth={Math.min(400, bounds.width)}
			minHeight={Math.min(300, bounds.height)}
			maxWidth={bounds.width}
			maxHeight={bounds.height}
			disableDragging={maximized || mobile}
			enableResizing={!maximized && !mobile}
			dragHandleClassName="window-drag-handle"
			cancel="button, input, select, a"
			onDragStart={() => manager.bringToFront(windowId)}
			onResizeStart={() => manager.bringToFront(windowId)}
			onDragStop={(_, data) =>
				manager.setFrame(
					windowId,
					fitFrame({ ...frame, x: data.x, y: data.y }, bounds),
				)
			}
			onResizeStop={(_, __, element, ___, position) =>
				manager.setFrame(
					windowId,
					fitFrame(
						{
							...position,
							width: element.offsetWidth,
							height: element.offsetHeight,
						},
						bounds,
					),
				)
			}
			style={{
				zIndex: manager.getZIndex(windowId),
				display: manager.isMinimized(windowId) ? "none" : undefined,
			}}
		>
			<section
				role="dialog"
				aria-label={title}
				className="window-shell"
				onPointerDownCapture={() => manager.bringToFront(windowId)}
				onFocusCapture={() => manager.bringToFront(windowId)}
			>
				<div
					role="toolbar"
					aria-label="Window controls"
					onContextMenu={(event) => {
						manager.bringToFront(windowId);
						showContextMenu(event, `${title} window actions`, [
							{
								label: "Bring to front",
								onSelect: () => manager.bringToFront(windowId),
							},
							{
								label: "Minimize",
								icon: <Minus size={15} />,
								onSelect: () => manager.minimize(windowId),
							},
							{
								label: maximized ? "Restore size" : "Zoom",
								icon: <Maximize2 size={15} />,
								onSelect: () => manager.toggleMaximized(windowId),
							},
							{
								label: "Close window",
								icon: <X size={15} />,
								onSelect: () => manager.close(windowId),
								separatorBefore: true,
							},
						]);
					}}
					className="window-titlebar window-drag-handle"
					onDoubleClick={(event) => {
						if (!(event.target as HTMLElement).closest("button,input"))
							manager.toggleMaximized(windowId);
					}}
				>
					<div className="traffic-lights">
						<button
							type="button"
							className="traffic-light close"
							aria-label={`Close ${title}`}
							onClick={() => manager.close(windowId)}
						>
							<X size={9} strokeWidth={3} />
						</button>
						<button
							type="button"
							className="traffic-light minimize"
							aria-label={`Minimize ${title}`}
							onClick={() => manager.minimize(windowId)}
						>
							<Minus size={9} strokeWidth={3} />
						</button>
						<button
							type="button"
							className="traffic-light maximize"
							aria-label={`${maximized ? "Restore" : "Maximize"} ${title}`}
							onClick={() => manager.toggleMaximized(windowId)}
						>
							{maximized ? <Minimize2 size={8} /> : <Maximize2 size={8} />}
						</button>
					</div>
					<span className="window-title">{title}</span>
					<div className="window-toolbar">{toolbar}</div>
				</div>
				<div className="window-content">{content}</div>
			</section>
		</Rnd>
	);
}
