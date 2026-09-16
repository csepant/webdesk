import { Check, FileText, Pencil, X } from "lucide-react";
import { type RefObject, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Window from "@/components/Window";
import { useFileSystem } from "@/contexts/FileSystemContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { type DesktopFile, isInTrash } from "@/lib/fileSystem";

function Document({ file }: { file: DesktopFile }) {
	const fs = useFileSystem();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(file.content ?? "");
	const [error, setError] = useState("");
	return (
		<div className="document-viewer">
			<div className="document-toolbar">
				<span>
					<FileText size={14} />
					{file.local
						? "Your note · saved in this browser"
						: "From Cris's desktop"}
				</span>
				{file.local &&
					(editing ? (
						<div>
							<button
								type="button"
								className="text-button"
								onClick={() => {
									setEditing(false);
									setError("");
								}}
							>
								<X size={14} />
								Cancel
							</button>
							<button
								type="button"
								className="primary-button compact"
								onClick={() => {
									try {
										fs.updateContent(file.id, draft);
										setEditing(false);
										setError("");
									} catch (err) {
										setError(
											err instanceof Error
												? err.message
												: "Could not save this note.",
										);
									}
								}}
							>
								<Check size={14} />
								Save
							</button>
						</div>
					) : (
						<button
							type="button"
							className="text-button"
							onClick={() => {
								setDraft(file.content ?? "");
								setEditing(true);
							}}
						>
							<Pencil size={14} />
							Edit note
						</button>
					))}
			</div>
			{editing ? (
				<textarea
					aria-label="Note content"
					className="note-editor"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					spellCheck={false}
				/>
			) : (
				<article className="markdown-document">
					<Markdown
						remarkPlugins={[remarkGfm]}
						components={{
							a: ({ children, href }) => (
								<a href={href} target="_blank" rel="noreferrer">
									{children}
								</a>
							),
						}}
					>
						{file.content || "This file is empty."}
					</Markdown>
				</article>
			)}
			{(error || fs.storageError) && (
				<p className="inline-error" aria-live="polite">
					{error || fs.storageError}
				</p>
			)}
		</div>
	);
}

export function FileViewerWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const wm = useWindowManager();
	const fs = useFileSystem();
	const file = wm.openFile ? fs.getFile(wm.openFile) : undefined;
	const available = file && !isInTrash(file, fs.files);
	return (
		<Window
			windowId="fileViewer"
			title={file?.name ?? "Preview"}
			parentRef={parentRef}
			content={
				available ? (
					<Document key={file.id} file={file} />
				) : (
					<div className="empty-folder">
						<FileText size={38} />
						<h2>
							{fs.loading ? "Opening file…" : "This file isn't available"}
						</h2>
						<p>It may have been moved to Trash or saved in another browser.</p>
						<button
							type="button"
							className="primary-button"
							onClick={() => wm.setOpenFolder("home")}
						>
							Open Finder
						</button>
					</div>
				)
			}
		/>
	);
}
