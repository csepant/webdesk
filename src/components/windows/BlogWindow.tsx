import type { RefObject } from "react";
import Window from "@/components/Window";
import { useWindowManager } from "@/contexts/WindowManagerContext";

export function BlogWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const { isOpen, close } = useWindowManager();

	if (!isOpen("blog")) return null;

	return (
		<Window
			open={true}
			title="BLOG.txt"
			subtitle="I write in human language sometimes"
			windowId="blog"
			content={
				<div>
					<p>
						Check out my latest posts on Medium! I tend to write about
						technology, web frameworks, DevOpsthings and more.
					</p>
					<ul className="list-disc list-inside mt-4">
						<li className="mb-2">
							<a
								href="https://medium.com/@csep94/why-convex-feels-like-cheating-d20d9f9c8ce1"
								target="_blank"
								className="text-sky-400 hover:underline"
								rel="noreferrer"
							>
								Why Convex Feels Like Cheating
							</a>
						</li>
					</ul>
				</div>
			}
			handler={() => close("blog")}
			parentRef={parentRef}
		/>
	);
}
