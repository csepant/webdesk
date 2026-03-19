import type { RefObject } from "react";
import Window from "@/components/Window";

interface FileData {
	name: string;
	content: string;
	createdAt?: number;
	updatedAt?: string;
}

export function FileViewerWindow({
	parentRef,
	file,
	onClose,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
	file: FileData | null;
	onClose: () => void;
}) {
	if (!file) return null;

	return (
		<Window
			open={true}
			title="File Viewer"
			subtitle={file.name}
			windowId="fileViewer"
			content={
				<div>
					<pre className="whitespace-pre-wrap break-words">{file.content}</pre>
				</div>
			}
			handler={onClose}
			parentRef={parentRef}
			createdAt={file.createdAt}
			updatedAt={file.updatedAt}
		/>
	);
}
