import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isInTrash } from "@/lib/fileSystem";
import { FileSystemProvider, useFileSystem } from "./FileSystemContext";

const convex = {};
vi.mock("convex/react", () => ({
	useQuery: () => undefined,
	useConvex: () => convex,
}));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
const workspace = () =>
	renderHook(() => useFileSystem(), { wrapper: FileSystemProvider });

describe("visitor workspace", () => {
	it("persists a created and edited note across mounts", () => {
		const first = workspace();
		let id = "";
		act(() => {
			id = first.result.current.create("My idea.md", "file", "documents");
		});
		act(() => first.result.current.updateContent(id, "# A saved idea"));
		first.unmount();
		const second = workspace();
		expect(second.result.current.getFile(id)?.content).toBe("# A saved idea");
	});
	it("keeps rapid consecutive creations and rejects duplicates", () => {
		const { result } = workspace();
		act(() => {
			result.current.create("One", "directory", "home");
			result.current.create("Two", "directory", "home");
		});
		expect(result.current.files.filter((file) => file.local)).toHaveLength(2);
		expect(() =>
			act(() => result.current.create("one", "directory", "home")),
		).toThrow("already exists");
	});
	it("moves, renames, trashes, and restores a folder without losing its children", () => {
		const { result } = workspace();
		let folder = "";
		let note = "";
		act(() => {
			folder = result.current.create("Ideas", "directory", "home");
		});
		act(() => {
			note = result.current.create("Draft.md", "file", folder);
		});
		act(() => {
			result.current.rename(folder, "Sketchbook");
			result.current.move(folder, "documents");
		});
		act(() => result.current.trash(folder));
		const requireFile = () => {
			const file = result.current.getFile(note);
			if (!file) throw new Error("Missing test note");
			return file;
		};
		expect(isInTrash(requireFile(), result.current.files)).toBe(true);
		act(() => result.current.restore(folder));
		expect(result.current.getFile(folder)).toMatchObject({
			name: "Sketchbook",
			parentId: "documents",
			deleted: false,
		});
		expect(isInTrash(requireFile(), result.current.files)).toBe(false);
	});
	it("restores an individually trashed note to home if its original folder is also in Trash", () => {
		const { result } = workspace();
		let folder = "";
		let note = "";
		act(() => {
			folder = result.current.create("Ideas", "directory", "home");
		});
		act(() => {
			note = result.current.create("Draft.md", "file", folder);
		});
		act(() => {
			result.current.trash(note);
			result.current.trash(folder);
		});
		act(() => result.current.restore(note));
		expect(result.current.getFile(note)).toMatchObject({
			deleted: false,
			parentId: "home",
		});
	});
	it("protects portfolio content from every mutation", () => {
		const { result } = workspace();
		for (const operation of [
			() => result.current.updateContent("about", "changed"),
			() => result.current.rename("about", "changed"),
			() => result.current.trash("about"),
			() => result.current.move("projects", "documents"),
		])
			expect(operation).toThrow("read-only");
	});
	it("preserves corrupt saved data and reports session-only storage", () => {
		localStorage.setItem("cris-desktop-files-v1", "broken");
		const { result } = workspace();
		act(() => result.current.create("New idea.md", "file", "home"));
		expect(result.current.storageError).toContain("couldn't be read");
		expect(localStorage.getItem("cris-desktop-files-v1")).toBe("broken");
	});
	it("keeps notes in memory and reports an exhausted storage quota", () => {
		const { result } = workspace();
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Quota exceeded");
		});
		act(() => result.current.create("My idea.md", "file", "home"));
		expect(
			result.current.files.some((file) => file.name === "My idea.md"),
		).toBe(true);
		expect(result.current.storageError).toContain("session only");
	});
});
