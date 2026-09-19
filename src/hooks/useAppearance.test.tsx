import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	APPEARANCE_STORAGE_KEY,
	appearanceBootstrap,
	DARK_MODE_QUERY,
} from "@/lib/appearance";
import { useAppearance } from "./useAppearance";

function mockSystem(dark: boolean) {
	const events = new EventTarget();
	const media = {
		matches: dark,
		media: DARK_MODE_QUERY,
		addEventListener: vi.fn(events.addEventListener.bind(events)),
		removeEventListener: vi.fn(events.removeEventListener.bind(events)),
	};
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => media),
	);
	return {
		media,
		change(next: boolean) {
			media.matches = next;
			events.dispatchEvent(
				Object.assign(new Event("change"), { matches: next }),
			);
		},
	};
}

beforeEach(() => {
	localStorage.clear();
	delete document.documentElement.dataset.theme;
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	delete document.documentElement.dataset.theme;
});

describe("desktop appearance", () => {
	it("defaults to the system and follows live changes without saving an override", () => {
		const system = mockSystem(true);
		const { result } = renderHook(useAppearance);
		expect(result.current.preference).toBe("system");
		expect(document.documentElement.dataset.theme).toBe("dark");
		act(() => system.change(false));
		expect(result.current.colorScheme).toBe("light");
		expect(document.documentElement.dataset.theme).toBe("light");
		expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
	});

	it("remembers an explicit choice and ignores system changes until System is selected", () => {
		const system = mockSystem(true);
		const { result, unmount } = renderHook(useAppearance);
		act(() => result.current.setPreference("light"));
		expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
		act(() => system.change(false));
		act(() => system.change(true));
		expect(document.documentElement.dataset.theme).toBe("light");
		unmount();
		const restored = renderHook(useAppearance);
		expect(restored.result.current.preference).toBe("light");
		expect(restored.result.current.colorScheme).toBe("light");
		act(() => restored.result.current.setPreference("system"));
		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("system");
		act(() => system.change(false));
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	it("restores a saved dark preference on a light system", () => {
		mockSystem(false);
		localStorage.setItem(APPEARANCE_STORAGE_KEY, "dark");
		const { result } = renderHook(useAppearance);
		expect(result.current.preference).toBe("dark");
		expect(document.documentElement.dataset.theme).toBe("dark");
	});

	it("treats an invalid saved preference as System", () => {
		mockSystem(true);
		localStorage.setItem(APPEARANCE_STORAGE_KEY, "invalid");
		const { result } = renderHook(useAppearance);
		expect(result.current.preference).toBe("system");
		expect(document.documentElement.dataset.theme).toBe("dark");
	});

	it("syncs another tab's choice and returns to System when site storage is cleared", () => {
		mockSystem(false);
		const { result } = renderHook(useAppearance);
		act(() =>
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: APPEARANCE_STORAGE_KEY,
					newValue: "dark",
					storageArea: localStorage,
				}),
			),
		);
		expect(result.current.preference).toBe("dark");
		expect(document.documentElement.dataset.theme).toBe("dark");
		act(() =>
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: "unrelated",
					newValue: "light",
					storageArea: localStorage,
				}),
			),
		);
		expect(result.current.preference).toBe("dark");
		act(() =>
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: null,
					newValue: null,
					storageArea: localStorage,
				}),
			),
		);
		expect(result.current.preference).toBe("system");
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	it("still switches for the current visit when storage is blocked", () => {
		mockSystem(true);
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		const { result } = renderHook(useAppearance);
		expect(document.documentElement.dataset.theme).toBe("dark");
		act(() => result.current.setPreference("light"));
		expect(document.documentElement.dataset.theme).toBe("light");
		expect(result.current.sessionOnly).toBe(true);
	});

	it("falls back to light without matchMedia while allowing manual dark mode", () => {
		vi.stubGlobal("matchMedia", undefined);
		const { result } = renderHook(useAppearance);
		expect(document.documentElement.dataset.theme).toBe("light");
		act(() => result.current.setPreference("dark"));
		expect(document.documentElement.dataset.theme).toBe("dark");
	});

	it("removes preference listeners on unmount", () => {
		const system = mockSystem(false);
		const { unmount } = renderHook(useAppearance);
		unmount();
		system.change(true);
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: APPEARANCE_STORAGE_KEY,
				newValue: "dark",
			}),
		);
		expect(document.documentElement.dataset.theme).toBe("light");
		expect(system.media.removeEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function),
		);
	});

	it.each([
		[null, true, "dark"],
		["light", true, "light"],
		["dark", false, "dark"],
		["invalid", true, "dark"],
	])(
		"applies %s with system dark %s before React mounts",
		(saved, systemDark, expected) => {
			mockSystem(systemDark);
			if (saved) localStorage.setItem(APPEARANCE_STORAGE_KEY, saved);
			// Execute the actual head script to check its first-paint behavior.
			Function(appearanceBootstrap)();
			expect(document.documentElement.dataset.theme).toBe(expected);
		},
	);
});
