import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenuProvider, useContextMenu } from "./ContextMenuContext";

afterEach(cleanup);
function Fixture({ action }: { action: () => void }) {
	const { showContextMenu } = useContextMenu();
	return (
		<>
			<button
				type="button"
				onContextMenu={(event) =>
					showContextMenu(event, "File actions", [
						{ label: "Open", onSelect: action },
						{ label: "Rename", disabled: true, onSelect: action },
						{ label: "Show in Finder", onSelect: action },
					])
				}
			>
				File
			</button>
			<button type="button">Outside</button>
		</>
	);
}
function setup() {
	const action = vi.fn();
	render(
		<ContextMenuProvider>
			<Fixture action={action} />
		</ContextMenuProvider>,
	);
	const origin = screen.getByRole("button", { name: "File" });
	fireEvent.contextMenu(origin, { clientX: 300, clientY: 200 });
	return { action, origin };
}

describe("context menus", () => {
	it("renders at the pointer in a portal, outside clipped window contents", () => {
		setup();
		const menu = screen.getByRole("menu", { name: "File actions" });
		expect(menu.parentElement).toBe(document.body);
		expect(menu.style.left).toBe("300px");
		expect(menu.style.top).toBe("200px");
	});
	it("keeps the menu inside the viewport near its bottom-right edge", () => {
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
			width: 220,
			height: 200,
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: 220,
			bottom: 200,
			toJSON: () => ({}),
		});
		const { origin } = setup();
		fireEvent.contextMenu(origin, {
			clientX: window.innerWidth - 1,
			clientY: window.innerHeight - 1,
		});
		const menu = screen.getByRole("menu");
		expect(Number.parseFloat(menu.style.left) + 220).toBeLessThanOrEqual(
			window.innerWidth - 8,
		);
		expect(Number.parseFloat(menu.style.top) + 200).toBeLessThanOrEqual(
			window.innerHeight - 8,
		);
	});
	it("supports keyboard navigation, skips disabled items, and restores focus on Escape", () => {
		const { origin } = setup();
		expect(document.activeElement).toBe(
			screen.getByRole("menuitem", { name: "Open" }),
		);
		fireEvent.keyDown(document.activeElement ?? document.body, {
			key: "ArrowDown",
		});
		expect(document.activeElement).toBe(
			screen.getByRole("menuitem", { name: "Show in Finder" }),
		);
		fireEvent.keyDown(document.activeElement ?? document.body, {
			key: "Escape",
		});
		expect(screen.queryByRole("menu")).toBeNull();
		expect(document.activeElement).toBe(origin);
	});
	it("runs an action exactly once and closes the menu", () => {
		const { action } = setup();
		fireEvent.click(screen.getByRole("menuitem", { name: "Open" }));
		expect(action).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("menu")).toBeNull();
	});
	it("dismisses on outside clicks without stealing focus or running an action", () => {
		const { action } = setup();
		fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
		expect(screen.queryByRole("menu")).toBeNull();
		expect(action).not.toHaveBeenCalled();
	});
});
