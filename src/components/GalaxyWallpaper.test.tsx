import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { GalaxyWallpaper } from "./GalaxyWallpaper";

const scene = vi.hoisted(() => ({ setPaused: vi.fn(), dispose: vi.fn() }));
const createGalaxy = vi.hoisted(() => vi.fn(() => scene));
vi.mock("@/lib/galaxy", () => ({ createGalaxy }));
let reduced = true;
let preferenceChange: (() => void) | undefined;
beforeEach(() => {
	vi.clearAllMocks();
	reduced = true;
	preferenceChange = undefined;
	vi.stubGlobal("matchMedia", () => ({
		get matches() {
			return reduced;
		},
		addEventListener: (_: string, listener: () => void) => {
			preferenceChange = listener;
		},
		removeEventListener: () => {
			preferenceChange = undefined;
		},
	}));
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
function SystemMotionWallpaper() {
	return <GalaxyWallpaper paused={useReducedMotion()} />;
}

describe("galaxy wallpaper integration", () => {
	it("starts still for Reduce Motion, responds to system changes, and disposes on unmount", async () => {
		const view = render(<SystemMotionWallpaper />);
		await waitFor(() =>
			expect(createGalaxy).toHaveBeenCalledWith(expect.any(HTMLElement), true),
		);
		act(() => {
			reduced = false;
			preferenceChange?.();
		});
		expect(scene.setPaused).toHaveBeenLastCalledWith(false);
		view.unmount();
		expect(scene.dispose).toHaveBeenCalledOnce();
		expect(preferenceChange).toBeUndefined();
	});
	it("does not allocate a renderer when switched away before the lazy import completes", async () => {
		const view = render(<GalaxyWallpaper paused={false} />);
		view.unmount();
		await act(async () => {
			await import("@/lib/galaxy");
		});
		expect(createGalaxy).not.toHaveBeenCalled();
	});
	it("keeps the static wallpaper available when WebGL cannot initialize", async () => {
		createGalaxy.mockImplementationOnce(() => {
			throw new Error("WebGL unavailable");
		});
		const view = render(<GalaxyWallpaper paused={false} />);
		await waitFor(() => expect(createGalaxy).toHaveBeenCalledOnce());
		expect(view.container.querySelector(".galaxy-wallpaper")).not.toBeNull();
		expect(view.container.querySelector('[data-ready="true"]')).toBeNull();
	});
});
