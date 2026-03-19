import { CloudSun } from "lucide-react";
import { Widget } from "@/components/Widget";

export function TemperatureWidget() {
	return (
		<Widget
			title="Office Temperature"
			content={
				<div className="w-full">
					<div className="flex flex-row items-center">
						<span className="text-6xl font-bold text-amber-400">22</span>
						<div className="relative h-10 w-6">
							<span className="absolute bottom-0 left-0 text-2xl font-semibold text-amber-300 mb-3">
								°C
							</span>
						</div>
						<CloudSun size={48} className="text-amber-400 ml-4 inline-block" />
					</div>
					<p className="mt-2 text-white/50 text-sm italic">
						Provided by: An ESP32 sitting on my desk.
					</p>
				</div>
			}
		/>
	);
}
