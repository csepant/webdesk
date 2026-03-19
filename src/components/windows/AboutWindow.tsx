import type { RefObject } from "react";
import Window from "@/components/Window";
import { useWindowManager } from "@/contexts/WindowManagerContext";

export function AboutWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const { isOpen, close } = useWindowManager();

	if (!isOpen("about")) return null;

	return (
		<Window
			open={true}
			title="ABOUT_ME.txt"
			subtitle="Developer | Cloud Engineer | Tinkerer"
			windowId="about"
			content={
				<div className="h-full">
					<div className="grid grid-cols-2">
						<div>
							<p className="mb-2">
								Hello! My name is Cristian Sepulveda and I am a software
								developer based in Santiago, Chile. I have been working for 10
								years in IT in different positions and roles. If I am honest I
								stumbled into this carreer a bit by accident. I started out as a
								WordPress administrator at a startup and well, fell in love with
								programming right away. Starting out by just writing a bit of
								HTML and CSS and then learning PHP and JavaScript. I am
								passionate about technology and solving problems in creative
								ways.
							</p>
							<p>
								I love working with modern technologies and frameworks to create
								seamless user experiences.
							</p>
						</div>

						<div className="flex flex-col items-center">
							<img
								src="/me.jpeg"
								alt="Profile"
								className="w-fit h-auto border border-sky-600 ml-4 mb-4 col-span-1"
							/>
							<span className="text-xs text-white/50">
								Me on my trip through Scandinavia
							</span>
						</div>
					</div>
					<div className="mt-4">
						<p>
							In my free time, I enjoy hiking, photography, and exploring new
							technologies. Feel free to reach out to me for collaboration or
							just to say hi!
						</p>
					</div>
				</div>
			}
			handler={() => close("about")}
			parentRef={parentRef}
		/>
	);
}
