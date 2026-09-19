import { useEffect, useRef } from "react";
import type { GalaxyScene } from "@/lib/galaxy";

export function GalaxyWallpaper({ paused }: { paused: boolean }) {
	const hostRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<GalaxyScene | null>(null);
	const pausedRef = useRef(paused);
	useEffect(() => {
		pausedRef.current = paused;
		sceneRef.current?.setPaused(paused);
	}, [paused]);
	useEffect(() => {
		let cancelled = false;
		// Three.js stays out of the initial desktop bundle and server render.
		import("@/lib/galaxy")
			.then(({ createGalaxy }) => {
				if (cancelled || !hostRef.current) return;
				sceneRef.current = createGalaxy(hostRef.current, pausedRef.current);
			})
			.catch(() => {
				// The static star field remains visible if WebGL isn't available.
			});
		return () => {
			cancelled = true;
			sceneRef.current?.dispose();
			sceneRef.current = null;
		};
	}, []);
	return <div ref={hostRef} className="galaxy-wallpaper" aria-hidden="true" />;
}
