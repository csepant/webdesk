import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
	useWindowManager,
	WindowManagerProvider,
} from "./WindowManagerContext";

afterEach(cleanup);
const openWindows = ["finder", "fileViewer", "contact"];
function Wrapper({ children }: { children: ReactNode }) {
	return (
		<WindowManagerProvider
			openWindows={openWindows}
			maximizedWindows={[]}
			navigate={async () => {}}
		>
			{children}
		</WindowManagerProvider>
	);
}

describe("window stacking", () => {
	it("raises an earlier-opened window above every later-opened window", () => {
		const { result } = renderHook(useWindowManager, { wrapper: Wrapper });
		expect(result.current.activeWindow).toBe("contact");
		act(() => result.current.bringToFront("finder"));
		expect(result.current.activeWindow).toBe("finder");
		expect(result.current.getZIndex("finder")).toBeGreaterThan(
			result.current.getZIndex("contact"),
		);
		expect(result.current.getZIndex("finder")).toBeGreaterThan(
			result.current.getZIndex("fileViewer"),
		);
	});
	it("follows repeated focus changes while keeping every window's stacking level distinct", () => {
		const { result } = renderHook(useWindowManager, { wrapper: Wrapper });
		for (const id of ["finder", "fileViewer", "finder", "contact", "finder"]) {
			act(() => result.current.bringToFront(id));
			expect(result.current.activeWindow).toBe(id);
			expect(result.current.getZIndex(id)).toBe(
				Math.max(
					...openWindows.map((window) => result.current.getZIndex(window)),
				),
			);
			expect(
				new Set(openWindows.map((window) => result.current.getZIndex(window)))
					.size,
			).toBe(3);
		}
	});
	it("reveals the next window on minimize and restores a Dock-selected window to the front", () => {
		const { result } = renderHook(useWindowManager, { wrapper: Wrapper });
		act(() => result.current.bringToFront("finder"));
		act(() => result.current.minimize("finder"));
		expect(result.current.activeWindow).toBe("contact");
		act(() => result.current.open("finder"));
		expect(result.current.isMinimized("finder")).toBe(false);
		expect(result.current.activeWindow).toBe("finder");
	});
	it("changes focus without changing a window's stored geometry", () => {
		const { result } = renderHook(useWindowManager, { wrapper: Wrapper });
		const frame = { x: 100, y: 150, width: 700, height: 500 };
		act(() => result.current.setFrame("finder", frame));
		act(() => result.current.bringToFront("finder"));
		act(() => result.current.bringToFront("fileViewer"));
		expect(result.current.frames.finder).toEqual(frame);
	});
});
