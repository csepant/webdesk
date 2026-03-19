import { Widget } from "@/components/Widget";

export function StressLevelWidget() {
	return (
		<Widget
			title="Cris's Stress Level"
			content={
				<div>
					<p>
						Current Stress Level:{" "}
						<span className="font-bold text-red-400">High</span>
					</p>
					<div className="relative flex-row mt-2">
						{[...Array(30)].map((_, i) => (
							<div className="relative inline-block w-1 h-6 mx-0.5" key={i}>
								<div
									className={`absolute bottom-0 left-0 h-full w-full ${i <= 10 ? "bg-green-400" : i > 11 && i <= 20 ? "bg-amber-400" : i > 20 ? "bg-red-400" : "bg-green-400"} rounded animate-ping opacity-75`}
									style={{ animationDelay: `${i * 15}ms` }}
								/>
								<div
									className={`relative inline-block w-1 h-6 ${i <= 10 ? "bg-green-500" : i > 11 && i <= 20 ? "bg-amber-500" : i > 20 ? "bg-red-500" : "bg-green-500"} rounded`}
								/>
							</div>
						))}
					</div>
					<p className="mt-2 text-white/50 text-sm italic">
						Cris's stress level is high due to tight deadlines and multiple
						projects. He may take longer to respond if you reach out to him now.
					</p>
				</div>
			}
		/>
	);
}
