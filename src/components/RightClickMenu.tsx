import { useCallback, useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export const RightClickMenu = ({
	position,
	onClose,
	onCreateFile,
}: {
	position: { x: number; y: number };
	onClose: () => void;
	onCreateFile: () => void;
}) => {
	const menuRef = useRef<HTMLDivElement>(null);

	useClickOutside(
		menuRef,
		useCallback(() => {
			onClose();
		}, [onClose]),
	);

	return (
		<div
			ref={menuRef}
			className="absolute z-50 w-48 bg-slate-950 border border-gray-300/25 rounded shadow-lg"
			style={{ top: position.y, left: position.x }}
		>
			<ul className="py-1">
				<li
					className="px-4 text-white py-2 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
					onClick={() => {
						onCreateFile();
						onClose();
					}}
				>
					{" "}
					Create New File
				</li>
			</ul>
		</div>
	);
};
