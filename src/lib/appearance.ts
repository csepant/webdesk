export const APPEARANCE_STORAGE_KEY = "cris-desktop-appearance-v1";
export const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";
export type AppearancePreference = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

export function parseAppearance(value: string | null): AppearancePreference {
	return value === "light" || value === "dark" ? value : "system";
}

export function resolveAppearance(
	preference: AppearancePreference,
	systemDark: boolean,
): ColorScheme {
	return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

// Runs before styles paint, so a saved or system dark theme never flashes light.
// Only the fixed light/dark tokens are written to the document.
export const appearanceBootstrap = `(() => {
  let preference = "system";
  try { preference = localStorage.getItem("${APPEARANCE_STORAGE_KEY}") || "system"; } catch {}
  const systemDark = typeof window.matchMedia === "function" && window.matchMedia("${DARK_MODE_QUERY}").matches;
  document.documentElement.dataset.theme = preference === "dark" || (preference !== "light" && systemDark) ? "dark" : "light";
})();`;
