export type FileKind = "file" | "directory" | "app";
export interface DesktopFile {
	id: string;
	name: string;
	type: FileKind;
	parentId: string;
	content?: string;
	appComponent?: string;
	updatedAt: string;
	local?: boolean;
	deleted?: boolean;
	sourceId?: string;
}
const date = "2026-01-01T12:00:00.000Z";
export const portfolioFiles: DesktopFile[] = [
	{
		id: "about",
		name: "About me.md",
		type: "file",
		parentId: "home",
		updatedAt: date,
		content: `# Hey, I'm Cris.\n\n**Developer, cloud engineer & curious human.**\n\nI'm Cristian Sepulveda, a software developer based in Santiago, Chile. I've spent 10 years in IT, working in different positions and roles.\n\nI stumbled into this career a little by accident. I started as a WordPress administrator at a startup, wrote a bit of HTML and CSS, and fell in love with programming. PHP and JavaScript followed, and I haven't stopped learning since.\n\nI enjoy solving problems in creative ways and building things that are useful, thoughtful, and a little fun.\n\n![Exploring Scandinavia](/me.jpeg)\n\n*Somewhere on my trip through Scandinavia.*\n\n## Away from the keyboard\n\nYou'll find me hiking, taking photographs, and tinkering with new technologies. Feel free to open Mail and say hello.`,
	},
	{
		id: "projects",
		name: "Projects",
		type: "directory",
		parentId: "home",
		updatedAt: date,
	},
	{
		id: "writing",
		name: "Writing",
		type: "directory",
		parentId: "home",
		updatedAt: date,
	},
	{
		id: "documents",
		name: "Documents",
		type: "directory",
		parentId: "home",
		updatedAt: date,
	},
	{
		id: "readme",
		name: "Read me.md",
		type: "file",
		parentId: "home",
		updatedAt: date,
		content: `# Make yourself at home.\n\nWelcome to my little corner of the internet. This website is a desktop you can explore.\n\n## A quick tour\n\n- **Finder** is where you'll find my projects, writing, and a little about me. Double-click a file to open it, or tap it on a touch screen.\n- Drag windows by their title bars and resize them from their edges.\n- The red button closes, yellow minimizes, and green maximizes. Double-clicking a title bar also maximizes it.\n- Click an app in the Dock to open it or restore its window.\n- Use the search field in Finder to search across this desktop.\n\n## Your own little workspace\n\nCreate folders and Markdown notes with the plus button in Finder. You can rename, edit, move, and trash your own files. Visit Trash to restore them.\n\nYour files are saved **only in this browser**. They aren't uploaded, shared with other visitors, or synced between devices. Clearing your browser's site data removes them.\n\nBuilt with React, TypeScript, TanStack, and Convex. Made with curiosity in Santiago, Chile.`,
	},
	{
		id: "contact-app",
		name: "Mail.app",
		type: "app",
		appComponent: "contact",
		parentId: "home",
		updatedAt: date,
	},
	{
		id: "projects-overview",
		name: "Projects.md",
		type: "file",
		parentId: "projects",
		updatedAt: date,
		content: `# Things I've built\n\nA mix of web applications, hardware experiments, and things that made me curious.\n\n## Web development\n\n- **DNRO** — An app for gig workers.\n- **Parkit** — Airbnb for parking spots.\n\n## Hardware & microcontrollers\n\n- A self-watering planter\n- An ESP32 weather station\n- A home automation system with MQTT\n\nI like working where software meets the real world.`,
	},
	{
		id: "writing-overview",
		name: "On the blog.md",
		type: "file",
		parentId: "writing",
		updatedAt: date,
		content: `# I write in human language, too.\n\nOccasional thoughts on technology, web frameworks, DevOps, and what I learn along the way.\n\n## From the blog\n\n[Why Convex Feels Like Cheating →](https://medium.com/@csep94/why-convex-feels-like-cheating-d20d9f9c8ce1)\n\nFind more on [my Medium profile](https://medium.com/@csep94).`,
	},
	{
		id: "welcome-note",
		name: "A little space for ideas.md",
		type: "file",
		parentId: "documents",
		updatedAt: date,
		content: `# A little space for ideas\n\nThis is your place to try the desktop. Create a note or a folder with the **+** button in Finder.\n\nYour files stay in this browser. Go ahead, make yourself at home.`,
	},
];

export function isInTrash(file: DesktopFile, files: DesktopFile[]): boolean {
	const seen = new Set<string>();
	let current: DesktopFile | undefined = file;
	while (current && !seen.has(current.id)) {
		if (current.deleted) return true;
		seen.add(current.id);
		const parentId: string = current.parentId;
		current = files.find((item) => item.id === parentId);
	}
	return false;
}

export function validateName(
	name: string,
	parentId: string,
	files: DesktopFile[],
	excludeId?: string,
): string {
	const trimmed = name.trim();
	if (
		!trimmed ||
		trimmed === "." ||
		trimmed === ".." ||
		/[/\\]/.test(trimmed) ||
		[...trimmed].some((character) => character.charCodeAt(0) < 32)
	)
		throw new Error("Choose a name without slashes or control characters.");
	if (trimmed.length > 100)
		throw new Error("Keep the name under 100 characters.");
	if (
		files.some(
			(file) =>
				file.id !== excludeId &&
				file.parentId === parentId &&
				!file.deleted &&
				file.name.toLowerCase() === trimmed.toLowerCase(),
		)
	)
		throw new Error("An item with that name already exists here.");
	return trimmed;
}

export function canMove(
	file: DesktopFile,
	parentId: string,
	files: DesktopFile[],
): boolean {
	if (!file.local || file.deleted) return false;
	if (parentId === "home") return true;
	let parent = files.find((item) => item.id === parentId);
	if (!parent || parent.type !== "directory" || isInTrash(parent, files))
		return false;
	const seen = new Set<string>();
	while (parent) {
		if (parent.id === file.id || seen.has(parent.id)) return false;
		seen.add(parent.id);
		const next: string = parent.parentId;
		parent = files.find((item) => item.id === next);
	}
	return true;
}

export function parseSavedFiles(value: string | null): DesktopFile[] {
	if (!value) return [];
	const parsed: unknown = JSON.parse(value);
	if (!Array.isArray(parsed)) throw new Error("Invalid workspace");
	return parsed
		.filter((file): file is DesktopFile =>
			Boolean(
				file &&
					typeof file === "object" &&
					typeof file.id === "string" &&
					file.id.startsWith("local-") &&
					typeof file.name === "string" &&
					typeof file.parentId === "string" &&
					typeof file.updatedAt === "string" &&
					["file", "directory"].includes(file.type) &&
					(file.content === undefined || typeof file.content === "string"),
			),
		)
		.map((file) => ({ ...file, local: true }));
}
