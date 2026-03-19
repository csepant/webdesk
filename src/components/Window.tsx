import { Maximize2, X } from "lucide-react";
import moment from "moment";
import type React from "react";
import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindowManager } from "@/contexts/WindowManagerContext";

export default function WindowComponent({
	title,
	subtitle,
	content,
	open,
	handler,
	parentRef,
	createdAt,
	updatedAt,
	windowId,
}: {
	title: string;
	subtitle: string;
	content: React.ReactNode;
	open?: boolean;
	handler?: () => void;
	parentRef?: React.RefObject<HTMLDivElement | null>;
	createdAt?: number;
	updatedAt?: string;
	windowId?: string;
}) {
	const DEFAULT_WIDTH = 800;
	const DEFAULT_HEIGHT = 600;

	const { bringToFront, getZIndex, isMaximized, toggleMaximized } =
		useWindowManager();
	const zIndex = windowId ? getZIndex(windowId) : 1;
	const maximized = windowId ? isMaximized(windowId) : false;

	const [windowWidth, setWindowWidth] = useState(
		parentRef?.current ? parentRef.current.offsetWidth : DEFAULT_WIDTH,
	);
	const [windowHeight, setWindowHeight] = useState(
		parentRef?.current ? parentRef.current.offsetHeight : DEFAULT_HEIGHT,
	);
	const [defaultX, setDefaultX] = useState(windowWidth / 2 - 200);
	const [defaultY, setDefaultY] = useState(windowHeight / 2 - 150);

	const handleOnFocus = () => {
		if (windowId) bringToFront(windowId);
	};

	const PADDING = 16 * 2;
	const handleMaximize = () => {
		if (windowId) toggleMaximized(windowId);
		setWindowWidth(
			parentRef?.current
				? parentRef.current.offsetWidth - PADDING
				: DEFAULT_WIDTH - PADDING,
		);
		setWindowHeight(
			parentRef?.current
				? parentRef.current.offsetHeight - PADDING
				: DEFAULT_HEIGHT - PADDING,
		);
	};

	// Sync dimensions when maximized on mount or when maximized changes
	useEffect(() => {
		if (maximized && parentRef?.current) {
			setWindowWidth(parentRef.current.offsetWidth - PADDING);
			setWindowHeight(parentRef.current.offsetHeight - PADDING);
		}
	}, [maximized, parentRef, PADDING]);

	useEffect(() => {
		const handleResize = () => {
			const w = parentRef?.current
				? parentRef.current.offsetWidth
				: DEFAULT_WIDTH;
			const h = parentRef?.current
				? parentRef.current.offsetHeight
				: DEFAULT_HEIGHT;
			setWindowWidth(w);
			setWindowHeight(h);
			if (!maximized) {
				setDefaultX(w / 2 - 200);
				setDefaultY(h / 2 - 150);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [maximized, parentRef]);

	if (!open) return null;
	return (
		<Rnd
			default={{ x: defaultX, y: defaultY, width: "400", height: "600" }}
			size={
				maximized ? { width: windowWidth, height: windowHeight } : undefined
			}
			position={maximized ? { x: 0, y: 0 } : undefined}
			enableResizing={!maximized}
			disableDragging={maximized}
			height={"100%"}
			width={"100%"}
			bounds="parent"
			onDragStart={handleOnFocus}
			onResizeStart={handleOnFocus}
			onMouseDown={handleOnFocus}
			dragHandleClassName="window-drag-handle"
			minWidth={300}
			minHeight={200}
			style={{ zIndex }}
		>
			<div
				className="w-full h-full max-h-800  backdrop-blur-lg border-2 border-sky-600/50 rounded-lg shadow-lg "
				style={{
					clipPath:
						"polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%, 30px 100%, 0 calc(100% - 30px))",
				}}
			>
				<div
					className={`absolute inset-0 transition-colors duration-300 bg-sky-600`}
					style={{
						clipPath:
							"polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%,  30px 100%, 0 calc(100% - 30px))",
						margin: "-10px",
					}}
				/>
				<div
					className="relative h-full bg-slate-900/95 backdrop-blur-sm overflow-hidden"
					style={{
						clipPath:
							"polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%, 30px 100%, 0 calc(100% - 30px))",
					}}
				>
					<div className="text-sm font-mono text-sky-500  mb-2">
						<div
							data-testid="window-controls"
							className="window-drag-handle grid grid-cols-4 w-full h-fit space-x-2"
						>
							<div className="grid col-span-4 px-8 w-full h-full bg-slate-950/50 cursor-move relative rounded-t-lg">
								<div
									data-testid="window-title"
									className="font-bold text-white py-4"
								>
									{title}
								</div>

								<div className="absolute right-4 top-2 flex space-x-2">
									<div
										className="flex items-center h-8 w-8 text-green-200 space-x-2 bg-green-500/50 p-2 rounded-full cursor-pointer"
										onClick={() => {
											handleMaximize();
										}}
										onTouchStart={() => {
											handleMaximize();
										}}
									>
										<Maximize2 className="h-full w-auto" size={18} />
									</div>
									<div
										className="flex items-center h-8 w-8 float-right text-red-200 bg-red-500/50 p-2 cursor-pointer rounded-full"
										onClick={handler}
										onTouchStart={handler}
									>
										<X className="h-full w-auto" size={18} />
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="px-8 overflow-y-autow h-[calc(100%-72px)] flex flex-col">
						<div className=" text-sky-500 py-2 font-semibold">{subtitle}</div>

						<div className="border-t border-sky-600/50 py-4 text-white/70 overflow-y-auto h-[calc(100%-120px)] border-b">
							{content}
						</div>
					</div>

					{/* Meta Info */}
					<div className="absolute bottom-2 right-2 text-xs text-white/30">
						{updatedAt && (
							<span className="mr-4">
								Updated At: {moment(updatedAt).fromNow()}
							</span>
						)}
						{createdAt && (
							<span className="hover:hidden">
								Created At: {moment(createdAt).fromNow()}
							</span>
						)}
					</div>
				</div>
			</div>
		</Rnd>
	);
}
