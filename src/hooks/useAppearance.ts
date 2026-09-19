import { useCallback, useEffect, useRef, useState } from "react";
import {
	APPEARANCE_STORAGE_KEY,
	type AppearancePreference,
	type ColorScheme,
	DARK_MODE_QUERY,
	parseAppearance,
	resolveAppearance,
} from "@/lib/appearance";

export function useAppearance() {
	const [preference, setPreferenceState] =
		useState<AppearancePreference>("system");
	const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
	const [sessionOnly, setSessionOnly] = useState(false);
	const preferenceRef = useRef<AppearancePreference>("system");
	const mediaRef = useRef<MediaQueryList | null>(null);
	const apply = useCallback(
		(next: AppearancePreference, systemDark: boolean) => {
			preferenceRef.current = next;
			const resolved = resolveAppearance(next, systemDark);
			document.documentElement.dataset.theme = resolved;
			setPreferenceState(next);
			setColorScheme(resolved);
		},
		[],
	);

	useEffect(() => {
		const media =
			typeof window.matchMedia === "function"
				? window.matchMedia(DARK_MODE_QUERY)
				: null;
		mediaRef.current = media;
		let saved: AppearancePreference = "system";
		try {
			saved = parseAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY));
		} catch {
			setSessionOnly(true);
		}
		apply(saved, media?.matches ?? false);
		const onSystemChange = (event: MediaQueryListEvent) =>
			apply(preferenceRef.current, event.matches);
		const onStorageChange = (event: StorageEvent) => {
			if (event.key !== APPEARANCE_STORAGE_KEY && event.key !== null) return;
			apply(parseAppearance(event.newValue), media?.matches ?? false);
		};
		media?.addEventListener("change", onSystemChange);
		window.addEventListener("storage", onStorageChange);
		return () => {
			media?.removeEventListener("change", onSystemChange);
			window.removeEventListener("storage", onStorageChange);
		};
	}, [apply]);

	const setPreference = useCallback(
		(next: AppearancePreference) => {
			apply(next, mediaRef.current?.matches ?? false);
			try {
				localStorage.setItem(APPEARANCE_STORAGE_KEY, next);
				setSessionOnly(false);
			} catch {
				setSessionOnly(true);
			}
		},
		[apply],
	);
	return { preference, colorScheme, setPreference, sessionOnly };
}
