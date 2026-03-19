import { useMutation } from "convex/react";
import type { RefObject } from "react";
import Button from "@/components/Button";
import Window from "@/components/Window";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { api } from "../../../convex/_generated/api";

export function CreateFileWindow({
	parentRef,
	contextMenuPosition,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
	contextMenuPosition: { x: number; y: number };
}) {
	const { isOpen, close } = useWindowManager();
	const createFile = useMutation(api.files.createFile);

	if (!isOpen("createFile")) return null;

	return (
		<Window
			open={true}
			title="Create New File"
			subtitle="Add a new file to the desktop"
			windowId="createFile"
			content={
				<div>
					<form
						onSubmit={async (e) => {
							e.preventDefault();
							const form = e.target as HTMLFormElement;
							const formData = new FormData(form);
							const fileName = formData.get("fileName") as string;
							const content = formData.get("content") as string;
							const position = {
								x: contextMenuPosition.x,
								y: contextMenuPosition.y,
							};

							await createFile({ name: fileName, content, position });
							close("createFile");
						}}
					>
						<div className="mb-4">
							<label
								className="block text-sm font-medium mb-1"
								htmlFor="fileName"
							>
								File Name:
							</label>
							<input
								type="text"
								id="fileName"
								name="fileName"
								className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
								required
							/>
						</div>
						<div className="mb-4">
							<label
								className="block text-sm font-medium mb-1"
								htmlFor="content"
							>
								Content:
							</label>
							<textarea
								id="content"
								name="content"
								rows={4}
								className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
								required
							/>
						</div>
						<Button>Create File</Button>
					</form>
				</div>
			}
			handler={() => close("createFile")}
			parentRef={parentRef}
		/>
	);
}
