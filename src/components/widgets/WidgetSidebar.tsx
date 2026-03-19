import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { StressLevelWidget } from "./StressLevelWidget";
import { TemperatureWidget } from "./TemperatureWidget";

export function WidgetSidebar({
	open,
	onClose,
}: { open: boolean; onClose: () => void }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;

		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onClose();
			}
		}

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open, onClose]);

	return (
		<AnimatePresence>
			{open && (
				<motion.section
					ref={ref}
					data-testid="widget-bar"
					initial={{ x: "100%" }}
					animate={{ x: 0 }}
					exit={{ x: "100%" }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					className="hidden md:grid md:col-start-4 w-full h-full grid-rows-4 bg-slate-900/20 shadow-lg backdrop-blur-sm gap-4 p-4 place-items-start self-start row-start-1"
				>
					<StressLevelWidget />
					<TemperatureWidget />
				</motion.section>
			)}
		</AnimatePresence>
	);
}
