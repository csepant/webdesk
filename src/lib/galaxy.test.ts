import type { Points, Scene } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGalaxy, type GalaxyScene } from "./galaxy";

const mocks = vi.hoisted(() => ({
	render: vi.fn(),
	loop: vi.fn(),
	dispose: vi.fn(),
	loseContext: vi.fn(),
	disconnect: vi.fn(),
}));
vi.mock("three", async (importOriginal) => {
	const three = await importOriginal<typeof import("three")>();
	return {
		...three,
		WebGLRenderer: class {
			domElement = document.createElement("canvas");
			setPixelRatio = vi.fn();
			setClearColor = vi.fn();
			setSize = vi.fn();
			render = mocks.render;
			setAnimationLoop = mocks.loop;
			dispose = mocks.dispose;
			forceContextLoss = mocks.loseContext;
		},
	};
});
let host: HTMLDivElement;
let galaxy: GalaxyScene | undefined;
let hidden = false;
beforeEach(() => {
	vi.clearAllMocks();
	hidden = false;
	vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe = vi.fn();
			disconnect = mocks.disconnect;
		},
	);
	host = document.createElement("div");
	Object.defineProperties(host, {
		clientWidth: { value: 1200 },
		clientHeight: { value: 900 },
	});
	document.body.append(host);
});
afterEach(() => {
	galaxy?.dispose();
	galaxy = undefined;
	host.remove();
	vi.unstubAllGlobals();
});
const currentLoop = () =>
	mocks.loop.mock.calls.at(-1)?.[0] as ((time: number) => void) | null;

describe("galaxy renderer lifecycle", () => {
	it("renders a still first frame when paused, then rotates the same scene when resumed", () => {
		galaxy = createGalaxy(host, true);
		expect(host.dataset.ready).toBe("true");
		expect(host.querySelectorAll("canvas")).toHaveLength(1);
		expect(mocks.render).toHaveBeenCalledOnce();
		expect(currentLoop()).toBeNull();
		const scene = mocks.render.mock.calls[0][0] as Scene;
		const stars = scene.children[0].children[0] as Points;
		galaxy.setPaused(false);
		const animate = currentLoop();
		animate?.(100);
		animate?.(140);
		expect(stars.rotation.z).toBeGreaterThan(0);
		expect(mocks.render).toHaveBeenCalledTimes(2);
		galaxy.setPaused(true);
		expect(currentLoop()).toBeNull();
	});

	it("suspends work in hidden tabs and preserves manual pause when the tab returns", () => {
		galaxy = createGalaxy(host, false);
		expect(currentLoop()).toBeTypeOf("function");
		hidden = true;
		document.dispatchEvent(new Event("visibilitychange"));
		expect(currentLoop()).toBeNull();
		hidden = false;
		document.dispatchEvent(new Event("visibilitychange"));
		expect(currentLoop()).toBeTypeOf("function");
		galaxy.setPaused(true);
		document.dispatchEvent(new Event("visibilitychange"));
		expect(currentLoop()).toBeNull();
	});

	it("shows the fallback during context loss and recovers without ignoring pause", () => {
		galaxy = createGalaxy(host, true);
		const canvas = host.querySelector("canvas");
		canvas?.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
		expect(host.dataset.ready).toBeUndefined();
		expect(currentLoop()).toBeNull();
		canvas?.dispatchEvent(new Event("webglcontextrestored"));
		expect(host.dataset.ready).toBe("true");
		expect(currentLoop()).toBeNull();
	});

	it("releases buffers, materials, observers, listeners, and context when switched away", () => {
		galaxy = createGalaxy(host, false);
		const scene = mocks.render.mock.calls[0][0] as Scene;
		const points = [
			scene.children[0].children[0],
			scene.children[1],
		] as Points[];
		const buffers = points.map((point) => vi.spyOn(point.geometry, "dispose"));
		const material = vi.spyOn(
			points[0].material as import("three").Material,
			"dispose",
		);
		galaxy.dispose();
		galaxy = undefined;
		for (const buffer of buffers) expect(buffer).toHaveBeenCalledOnce();
		expect(material).toHaveBeenCalledOnce();
		expect(mocks.dispose).toHaveBeenCalledOnce();
		expect(mocks.loseContext).toHaveBeenCalledOnce();
		expect(mocks.disconnect).toHaveBeenCalledOnce();
		expect(host.querySelector("canvas")).toBeNull();
		expect(currentLoop()).toBeNull();
		mocks.loop.mockClear();
		document.dispatchEvent(new Event("visibilitychange"));
		expect(mocks.loop).not.toHaveBeenCalled();
	});
});
