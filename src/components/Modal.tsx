import { type ReactNode, useEffect, useRef } from "react";

// The native modal keeps focus inside the sheet and makes the desktop inert.
export function Modal({
	children,
	className,
	label,
	onClose,
}: {
	children: ReactNode;
	className: string;
	label: string;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = ref.current;
		dialog?.showModal();
		return () => dialog?.close();
	}, []);
	return (
		<dialog
			ref={ref}
			className={className}
			aria-label={label}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onPointerDown={(event) => {
				if (event.target !== event.currentTarget) return;
				const rect = event.currentTarget.getBoundingClientRect();
				if (
					event.clientX < rect.left ||
					event.clientX > rect.right ||
					event.clientY < rect.top ||
					event.clientY > rect.bottom
				)
					onClose();
			}}
		>
			{children}
		</dialog>
	);
}
