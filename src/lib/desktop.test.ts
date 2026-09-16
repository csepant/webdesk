import { describe, expect, it } from "vitest";
import {
	canMove,
	type DesktopFile,
	isInTrash,
	parseSavedFiles,
	validateName,
} from "./fileSystem";
import { fitFrame, initialFrame } from "./windowGeometry";

const folder: DesktopFile = {
	id: "local-folder",
	name: "Ideas",
	type: "directory",
	parentId: "home",
	local: true,
	updatedAt: "2026-09-16",
};
const nested: DesktopFile = {
	...folder,
	id: "local-nested",
	name: "Drafts",
	parentId: folder.id,
};
const note: DesktopFile = {
	...folder,
	id: "local-note",
	name: "Hello.md",
	type: "file",
	parentId: nested.id,
	content: "# Hello",
};

describe("window geometry", () => {
	it("keeps a moved and resized window unchanged when it fits", () => {
		const frame = { x: 200, y: 140, width: 700, height: 500 };
		expect(fitFrame(frame, { width: 1200, height: 800 })).toEqual(frame);
	});
	it("keeps the title bar and resize handles reachable after a screen shrinks", () => {
		expect(
			fitFrame(
				{ x: 900, y: 600, width: 850, height: 550 },
				{ width: 390, height: 600 },
			),
		).toEqual({ x: 0, y: 50, width: 390, height: 550 });
	});
	it("doesn't destroy stored normal geometry while fitting a small viewport", () => {
		const frame = { x: 200, y: 100, width: 850, height: 550 };
		fitFrame(frame, { width: 375, height: 400 });
		expect(fitFrame(frame, { width: 1200, height: 800 })).toEqual(frame);
	});
	it("opens all apps within mobile and short landscape desktop bounds", () => {
		for (const bounds of [
			{ width: 320, height: 460 },
			{ width: 900, height: 280 },
		])
			for (const id of ["finder", "fileViewer", "contact"]) {
				const frame = initialFrame(id, bounds);
				expect(frame.x).toBeGreaterThanOrEqual(0);
				expect(frame.y).toBeGreaterThanOrEqual(0);
				expect(frame.x + frame.width).toBeLessThanOrEqual(bounds.width);
				expect(frame.y + frame.height).toBeLessThanOrEqual(bounds.height);
			}
	});
});

describe("filesystem invariants", () => {
	it("hides descendants of trashed folders and restores them with the parent", () => {
		expect(isInTrash(note, [{ ...folder, deleted: true }, nested, note])).toBe(
			true,
		);
		expect(isInTrash(note, [folder, nested, note])).toBe(false);
	});
	it("prevents moving a folder into itself or any of its descendants", () => {
		expect(canMove(folder, folder.id, [folder, nested, note])).toBe(false);
		expect(canMove(folder, nested.id, [folder, nested, note])).toBe(false);
		expect(canMove(note, folder.id, [folder, nested, note])).toBe(true);
	});
	it("rejects moves into files, missing folders, or trashed folders", () => {
		expect(canMove(nested, note.id, [folder, nested, note])).toBe(false);
		expect(canMove(note, "missing", [folder, note])).toBe(false);
		expect(canMove(note, folder.id, [{ ...folder, deleted: true }, note])).toBe(
			false,
		);
	});
	it("blocks writes to portfolio files", () =>
		expect(canMove({ ...note, local: false }, "home", [folder, note])).toBe(
			false,
		));
	it("rejects duplicate names ignoring case but permits a rename's own name", () => {
		expect(() => validateName("hello.MD", nested.id, [note])).toThrow(
			"already exists",
		);
		expect(validateName("Hello.md", nested.id, [note], note.id)).toBe(
			"Hello.md",
		);
		expect(validateName("Hello.md", "home", [note])).toBe("Hello.md");
	});
	it("rejects blank names, path separators, and control characters", () => {
		for (const name of ["  ", ".", "..", "a/b", "a\\b", "a\u0000b"])
			expect(() => validateName(name, "home", [])).toThrow();
	});
	it("validates saved files without allowing a local record to override a portfolio ID", () => {
		expect(
			parseSavedFiles(
				JSON.stringify([
					note,
					{ ...note, id: "about" },
					{ ...note, content: {} },
					null,
				]),
			),
		).toEqual([note]);
		expect(() => parseSavedFiles("broken JSON")).toThrow();
	});
	it("doesn't loop on malformed cyclic folder data", () => {
		expect(
			isInTrash(note, [{ ...folder, parentId: nested.id }, nested, note]),
		).toBe(false);
	});
});
