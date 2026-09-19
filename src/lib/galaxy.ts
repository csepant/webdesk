import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	DoubleSide,
	Group,
	Mesh,
	PerspectiveCamera,
	PlaneGeometry,
	Points,
	Scene,
	ShaderMaterial,
	WebGLRenderer,
} from "three";
import {
	galaxyCloudFragmentShader,
	galaxyCloudVertexShader,
} from "./galaxyCloud";

export interface GalaxyScene {
	setPaused: (paused: boolean) => void;
	dispose: () => void;
}

const vertexShader = `
attribute float size;
attribute float brightness;
uniform float pixelRatio;
varying vec3 starColor;
varying float starBrightness;
void main() {
	starColor = color;
	starBrightness = brightness;
	vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * viewPosition;
	gl_PointSize = clamp(size * pixelRatio * (200.0 / -viewPosition.z), 1.0, 48.0);
}`;
const fragmentShader = `
varying vec3 starColor;
varying float starBrightness;
void main() {
	float radius = length(gl_PointCoord - 0.5) * 2.0;
	if (radius > 1.0) discard;
	float glow = exp(-radius * radius * 5.0) * 0.22;
	float core = exp(-radius * radius * 40.0) * 0.78;
	gl_FragColor = vec4(starColor, (glow + core) * starBrightness);
	#include <colorspace_fragment>
}`;

/** Owns all GPU resources and listeners for one wallpaper instance. */
export function createGalaxy(
	host: HTMLElement,
	initiallyPaused: boolean,
): GalaxyScene {
	const renderer = new WebGLRenderer({
		alpha: true,
		antialias: false,
		powerPreference: "low-power",
	});
	const canvas = renderer.domElement;
	canvas.setAttribute("aria-hidden", "true");
	const scene = new Scene();
	const camera = new PerspectiveCamera(45, 1, 0.1, 100);
	const tiltedDisk = new Group();
	// Keep the inclined silhouette fixed while stars and dust rotate within it.
	tiltedDisk.rotation.order = "ZYX";
	tiltedDisk.rotation.set(1.12, 0, 0.48);
	scene.add(tiltedDisk);
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
	renderer.setPixelRatio(pixelRatio);
	renderer.setClearColor(0x090c10, 0);
	const material = new ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: { pixelRatio: { value: pixelRatio } },
		vertexColors: true,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
	});
	const geometries: BufferGeometry[] = [];
	const cloudMaterial = new ShaderMaterial({
		vertexShader: galaxyCloudVertexShader,
		fragmentShader: galaxyCloudFragmentShader,
		transparent: true,
		depthWrite: false,
		side: DoubleSide,
	});
	const diskGeometry = new PlaneGeometry(30, 30);
	geometries.push(diskGeometry);
	const disk = new Mesh(diskGeometry, cloudMaterial);
	disk.renderOrder = -1;
	// Seeded positions keep the composition steady when changing wallpapers.
	let seed = 71392;
	const random = () => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed / 4294967296;
	};
	const gaussian = () =>
		Math.sqrt(-2 * Math.log(Math.max(random(), 0.00001))) *
		Math.cos(random() * Math.PI * 2);
	const innerColor = new Color("#ffdcaa");
	const outerColor = new Color("#8bbcff");
	const nebulaColor = new Color("#ec89b5");
	const white = new Color("#ffffff");
	const color = new Color();
	const makeStars = (count: number, background = false) => {
		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const brightness = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			const offset = i * 3;
			if (background) {
				positions[offset] = (random() - 0.5) * 90;
				positions[offset + 1] = (random() - 0.5) * 65;
				positions[offset + 2] = -10 - random() * 25;
				color.copy(random() < 0.3 ? innerColor : outerColor).lerp(white, 0.45);
				sizes[i] = 0.2 + random() ** 7 * 1.3;
				brightness[i] = 0.4 + random() * 0.6;
			} else {
				const core = random() < 0.12;
				const radius = core
					? Math.sqrt(random()) * 2.8
					: Math.sqrt(random()) * 13.5;
				const arm = (i % 2) * Math.PI;
				const angle =
					core || random() < 0.72
						? random() * Math.PI * 2
						: arm + radius * 0.24 + gaussian() * 0.45;
				positions[offset] = Math.cos(angle) * radius + gaussian() * 0.12;
				positions[offset + 1] = Math.sin(angle) * radius + gaussian() * 0.12;
				positions[offset + 2] = gaussian() * (core ? 0.45 : 0.12);
				color.copy(innerColor).lerp(outerColor, Math.min(radius / 9, 1));
				if (radius > 5 && random() < 0.06) color.lerp(nebulaColor, 0.8);
				sizes[i] = 0.15 + random() ** 7 * 1.2;
				brightness[i] = (0.22 + random() * 0.45) * (1 - radius / 17);
			}
			color.toArray(colors, offset);
		}
		const geometry = new BufferGeometry();
		geometry.setAttribute("position", new BufferAttribute(positions, 3));
		geometry.setAttribute("color", new BufferAttribute(colors, 3));
		geometry.setAttribute("size", new BufferAttribute(sizes, 1));
		geometry.setAttribute("brightness", new BufferAttribute(brightness, 1));
		geometries.push(geometry);
		return new Points(geometry, material);
	};
	const galaxy = new Group();
	galaxy.add(disk, makeStars(host.clientWidth < 640 ? 7000 : 16000));
	tiltedDisk.add(galaxy);
	scene.add(makeStars(2300, true));
	host.append(canvas);
	let paused = initiallyPaused;
	let disposed = false;
	let contextLost = false;
	let lastFrame = 0;
	const render = () => {
		if (disposed || contextLost) return;
		renderer.render(scene, camera);
		host.dataset.ready = "true";
	};
	const animate = (time: number) => {
		if (!lastFrame) lastFrame = time;
		const delta = time - lastFrame;
		// A calm wallpaper needs at most 30 draws per second.
		if (delta < 1000 / 30) return;
		galaxy.rotation.z += Math.min(delta, 100) * 0.000018;
		lastFrame = time;
		render();
	};
	const updatePlayback = () => {
		lastFrame = 0;
		renderer.setAnimationLoop(
			!paused && !document.hidden && !contextLost ? animate : null,
		);
	};
	const resize = () => {
		const width = Math.max(host.clientWidth, 1);
		const height = Math.max(host.clientHeight, 1);
		camera.aspect = width / height;
		camera.position.z = 26 + Math.max(0, 1.2 - camera.aspect) * 16;
		camera.updateProjectionMatrix();
		tiltedDisk.position.set(camera.aspect > 1 ? 2.8 : 0, 0.2, 0);
		renderer.setSize(width, height, false);
		render();
	};
	const onContextLost = (event: Event) => {
		event.preventDefault();
		contextLost = true;
		delete host.dataset.ready;
		updatePlayback();
	};
	const onContextRestored = () => {
		contextLost = false;
		resize();
		updatePlayback();
	};
	const observer = new ResizeObserver(resize);
	observer.observe(host);
	document.addEventListener("visibilitychange", updatePlayback);
	canvas.addEventListener("webglcontextlost", onContextLost);
	canvas.addEventListener("webglcontextrestored", onContextRestored);
	resize();
	updatePlayback();
	return {
		setPaused(next) {
			paused = next;
			updatePlayback();
		},
		dispose() {
			disposed = true;
			renderer.setAnimationLoop(null);
			observer.disconnect();
			document.removeEventListener("visibilitychange", updatePlayback);
			canvas.removeEventListener("webglcontextlost", onContextLost);
			canvas.removeEventListener("webglcontextrestored", onContextRestored);
			for (const geometry of geometries) geometry.dispose();
			material.dispose();
			cloudMaterial.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
			delete host.dataset.ready;
		},
	};
}
