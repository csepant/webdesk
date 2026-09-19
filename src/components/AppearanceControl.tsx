import { Monitor, Moon, Sun } from "lucide-react";
import { useId } from "react";
import type { useAppearance } from "@/hooks/useAppearance";

export function AppearanceControl({
	preference,
	colorScheme,
	setPreference,
	sessionOnly,
}: ReturnType<typeof useAppearance>) {
	const name = useId();
	return (
		<fieldset className="appearance-control">
			<legend>Appearance</legend>
			<div className="appearance-options">
				{(
					[
						{ value: "light", label: "Light", icon: Sun },
						{ value: "dark", label: "Dark", icon: Moon },
						{ value: "system", label: "System", icon: Monitor },
					] as const
				).map(({ value, label, icon: Icon }) => (
					<label
						key={value}
						className={`appearance-option ${preference === value ? "selected" : ""}`}
					>
						<input
							className="sr-only"
							type="radio"
							name={name}
							aria-label={`${label} appearance`}
							value={value}
							checked={preference === value}
							onChange={() => setPreference(value)}
						/>
						<Icon size={19} strokeWidth={1.6} />
						<span>{label}</span>
					</label>
				))}
			</div>
			<p className="appearance-status" aria-live="polite">
				{sessionOnly
					? "For this visit · browser storage is unavailable."
					: preference === "system"
						? `Following your system · ${colorScheme} mode`
						: `${colorScheme === "dark" ? "Dark" : "Light"} mode · saved for next time`}
			</p>
		</fieldset>
	);
}
