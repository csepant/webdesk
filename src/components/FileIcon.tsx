import { Code2, FileText, Mail, PenLine, UserRound } from "lucide-react";
import type { DesktopFile } from "@/lib/fileSystem";

export function FileIcon({
	file,
	small = false,
}: {
	file: Pick<DesktopFile, "id" | "type" | "name">;
	small?: boolean;
}) {
	if (file.type === "directory")
		return (
			<span
				className={`file-icon folder-icon ${small ? "small" : ""}`}
				aria-hidden="true"
			>
				<span className="folder-back" />
				<span className="folder-front">
					{file.id === "projects" ? (
						<Code2 />
					) : file.id === "writing" ? (
						<PenLine />
					) : null}
				</span>
			</span>
		);
	if (file.type === "app")
		return (
			<span
				className={`file-icon mail-icon ${small ? "small" : ""}`}
				aria-hidden="true"
			>
				<Mail />
			</span>
		);
	return (
		<span
			className={`file-icon document-icon ${small ? "small" : ""} ${file.id === "about" ? "about-icon" : ""}`}
			aria-hidden="true"
		>
			{file.id === "about" ? <UserRound /> : <FileText />}
			<span>{file.name.split(".").at(-1)?.toUpperCase()}</span>
		</span>
	);
}
