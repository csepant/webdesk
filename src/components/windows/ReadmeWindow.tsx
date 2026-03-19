import type { RefObject } from "react";
import Window from "@/components/Window";
import { useWindowManager } from "@/contexts/WindowManagerContext";

export function ReadmeWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const { isOpen, close } = useWindowManager();

	if (!isOpen("readme")) return null;

	return (
		<Window
			open={true}
			title="README.md"
			subtitle="About this site"
			windowId="readme"
			content={
				<div>
					<p>
						I set the goal to make my personal website as a desktop environment.
						I was tired of creating the same old boring websites so I thought,
						why not make it fun? Sometimes that is my sole motivator for trying
						things. Making it fun and engaging for the user all the while having
						a bit of fun myself while building things. Feel free to explore and
						interact with the different files on the desktop!
					</p>
					<h3 className="mt-4 mb-2 text-sky-500 font-semibold">The Design</h3>
					<p>
						I am inspired by futuristic and cyberpunk aesthetics and I wanted to
						recreate that vibe here. Am fascinated by the blue tinted screens
						and neon lights you often see in movies and games so I tried
						incorporating some of those elements into the design of this site. I
						have to admit, I was also lazy and wanted to come up with a design
						that allowed to reuse a lot of the same components so windows and
						files made perfect sense. I also did not want to spend time messing
						with routing and navigation (again, lazy) so a desktop metaphor made
						perfect sense. After all these years making corporate and business
						websites, I just wanted to have fun and make something different.
					</p>
				</div>
			}
			handler={() => close("readme")}
			parentRef={parentRef}
		/>
	);
}
