import {
	createContext,
	type MouseEvent,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
	label: string;
	onSelect: () => void;
	icon?: ReactNode;
	disabled?: boolean;
	separatorBefore?: boolean;
}
interface MenuState {
	x: number;
	y: number;
	label: string;
	items: ContextMenuItem[];
}
interface ContextMenuValue {
	showContextMenu: (
		event: MouseEvent<HTMLElement>,
		label: string,
		items: ContextMenuItem[],
	) => void;
}
const Context = createContext<ContextMenuValue | null>(null);

function Menu({
	menu,
	dismiss,
}: {
	menu: MenuState;
	dismiss: (restoreFocus?: boolean) => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: menu.x, y: menu.y });
	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;
		const bounds = element.getBoundingClientRect();
		setPosition({
			x: Math.max(8, Math.min(menu.x, window.innerWidth - bounds.width - 8)),
			y: Math.max(8, Math.min(menu.y, window.innerHeight - bounds.height - 8)),
		});
		element.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
	}, [menu]);
	useEffect(() => {
		const outside = (event: PointerEvent) => {
			if (!ref.current?.contains(event.target as Node)) dismiss();
		};
		const close = () => dismiss();
		const scroll = (event: Event) => {
			if (!ref.current?.contains(event.target as Node)) dismiss();
		};
		document.addEventListener("pointerdown", outside, true);
		document.addEventListener("scroll", scroll, true);
		window.addEventListener("resize", close);
		window.addEventListener("blur", close);
		return () => {
			document.removeEventListener("pointerdown", outside, true);
			document.removeEventListener("scroll", scroll, true);
			window.removeEventListener("resize", close);
			window.removeEventListener("blur", close);
		};
	}, [dismiss]);
	return (
		<div
			ref={ref}
			role="menu"
			aria-label={menu.label}
			className="popover context-menu"
			style={{ left: position.x, top: position.y }}
			onContextMenu={(event) => event.preventDefault()}
			onKeyDown={(event) => {
				if (event.key === "Escape" || event.key === "Tab") {
					event.preventDefault();
					event.stopPropagation();
					dismiss(true);
					return;
				}
				if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
					return;
				event.preventDefault();
				const buttons = Array.from(
					ref.current?.querySelectorAll<HTMLButtonElement>(
						"button:not(:disabled)",
					) ?? [],
				);
				const current = buttons.indexOf(
					document.activeElement as HTMLButtonElement,
				);
				const next =
					event.key === "Home"
						? 0
						: event.key === "End"
							? buttons.length - 1
							: (current +
									(event.key === "ArrowDown" ? 1 : -1) +
									buttons.length) %
								buttons.length;
				buttons[next]?.focus();
			}}
		>
			{menu.items.map((item) => (
				<button
					type="button"
					role="menuitem"
					tabIndex={-1}
					key={item.label}
					disabled={item.disabled}
					className={item.separatorBefore ? "context-menu-divider" : undefined}
					onClick={() => {
						dismiss(true);
						item.onSelect();
					}}
				>
					<span className="context-menu-icon" aria-hidden="true">
						{item.icon}
					</span>
					<span>{item.label}</span>
				</button>
			))}
		</div>
	);
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
	const [menu, setMenu] = useState<MenuState | null>(null);
	const origin = useRef<HTMLElement | null>(null);
	const dismiss = useCallback((restoreFocus = false) => {
		setMenu(null);
		if (restoreFocus && origin.current?.isConnected)
			origin.current.focus({ preventScroll: true });
	}, []);
	const showContextMenu = useCallback(
		(
			event: MouseEvent<HTMLElement>,
			label: string,
			items: ContextMenuItem[],
		) => {
			event.preventDefault();
			event.stopPropagation();
			const bounds = event.currentTarget.getBoundingClientRect();
			const target = (event.target as HTMLElement).closest<HTMLElement>(
				"button, [tabindex]",
			);
			origin.current =
				target ??
				(document.activeElement instanceof HTMLElement
					? document.activeElement
					: null);
			setMenu({
				x: event.clientX || bounds.left + 16,
				y: event.clientY || bounds.top + 16,
				label,
				items,
			});
		},
		[],
	);
	return (
		<Context.Provider value={{ showContextMenu }}>
			{children}
			{menu &&
				createPortal(<Menu menu={menu} dismiss={dismiss} />, document.body)}
		</Context.Provider>
	);
}

export function useContextMenu() {
	const context = useContext(Context);
	if (!context)
		throw new Error("useContextMenu must be used within ContextMenuProvider");
	return context;
}
