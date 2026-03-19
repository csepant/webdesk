import { useMutation } from "convex/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { useClickOutside } from "@/hooks/useClickOutside";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const FileContextMenu = ({
	open,
	rename,
	deleteFile,
}: {
	open: () => void;
	rename: () => void;
	deleteFile: () => void;
}) => {
	return (
		<div className="absolute bg-gray-800 border border-gray-600 rounded shadow-lg z-50">
			<div
				className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
				onClick={open}
			>
				Open
			</div>
			<div
				className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
				onClick={rename}
			>
				Rename
			</div>
			<div
				className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
				onClick={deleteFile}
			>
				Delete
			</div>
		</div>
	);
};

export default function FileComponent({
	id,
	name,
	onClick,
	icon,
	position,
	fileContextMenuOpen,
}: {
	id?: Id<"files">;
	name: string;
	onClick: () => void;
	icon: React.ReactNode;
	position?: { x: number; y: number };
	fileContextMenuOpen?: (open: boolean) => void;
}) {
	const [onFocus, setOnFocus] = useState(false);
	const [positionState, setPositionState] = useState(position);
	const [openContextMenu, setOpenContextMenu] = useState(false);
	const fileRef = useRef<HTMLDivElement>(null);

	const deleteFile = useMutation(api.files.deleteFile);
	const renameFile = useMutation(api.files.renameFile);
	const updateFilePosition = useMutation(api.files.updateFilePosition);

	useClickOutside(
		fileRef,
		useCallback(() => {
			setOnFocus(false);
			setOpenContextMenu(false);
			fileContextMenuOpen?.(false);
		}, [fileContextMenuOpen]),
	);

	useEffect(() => {
		if (openContextMenu) {
			fileContextMenuOpen?.(true);
		}
	}, [openContextMenu, fileContextMenuOpen]);

	return (
		<Rnd
			default={{ x: 20, y: 20, width: 100, height: 100 }}
			minWidth={80}
			minHeight={80}
			bounds="parent"
			dragGrid={[20, 20]}
			enableResizing={false}
			onDrag={(e, d) => {
				setPositionState({ x: d.x, y: d.y });
				id && updateFilePosition({ fileId: id, position: { x: d.x, y: d.y } });
			}}
			position={positionState}
		>
			<div
				ref={fileRef}
				className={`w-full h-full flex flex-col items-center justify-center cursor-pointer ${onFocus ? "bg-sky-600/30" : "bg-transparent"} rounded-lg p-2 hover:bg-sky-600/20`}
				onBlur={() => setOnFocus(false)}
				onDoubleClick={onClick}
				onClick={() => setOnFocus(true)}
				onTouchStart={() => {
					setOnFocus(true);
					onClick();
				}}
				onContextMenu={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setOnFocus(true);
					setOpenContextMenu(true);
				}}
			>
				{openContextMenu && (
					<FileContextMenu
						open={() => {
							onClick();
							setOpenContextMenu(false);
						}}
						rename={() => {
							const newName = prompt("Enter new file name", name);
							if (newName && id) {
								renameFile({ fileId: id, newName });
							}
							setOpenContextMenu(false);
						}}
						deleteFile={() => {
							const confirmDelete = confirm(
								`Are you sure you want to delete ${name}?`,
							);
							if (confirmDelete && id) {
								deleteFile({ fileId: id });
							}
							setOpenContextMenu(false);
						}}
					/>
				)}
				<div className="text-sky-400 mb-2 text-shadow-lg">{icon}</div>
				<div className="text-sm text-white text-center px-2 text-shadow-lg">
					{name}
				</div>
			</div>
		</Rnd>
	);
}
