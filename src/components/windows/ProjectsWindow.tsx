import type { RefObject } from "react";
import Window from "@/components/Window";
import { useWindowManager } from "@/contexts/WindowManagerContext";

export function ProjectsWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const { isOpen, close } = useWindowManager();

	if (!isOpen("projects")) return null;

	return (
		<Window
			open={true}
			title="PROJECTS.d"
			subtitle="Things I've Done"
			windowId="projects"
			content={
				<div>
					<span className="font-semibold text-sky-500 text-md mb-2">
						Arduino/Microcontroller Projects:
					</span>
					<ul className="list-disc list-inside mb-4">
						<li>Self watering planter</li>
						<li>ESP32 weather station</li>
						<li>Home automation system with MQTT</li>
					</ul>
					<span className="font-semibold text-sky-500 text-md mb-2">
						Web Development Projects:
					</span>
					<ul className="list-disc list-inside">
						<li>DNRO - Gig worker app.</li>
						<li>Parkit - Airbnb for parking spots.</li>
						<li></li>
					</ul>
				</div>
			}
			handler={() => close("projects")}
			parentRef={parentRef}
		/>
	);
}
