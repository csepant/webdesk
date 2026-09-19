// A continuous stellar disk with two broad, soft density bands and mottled dust.
// The particle layer supplies individual stars; this supplies the photographic glow.
export const galaxyCloudVertexShader = `
varying vec2 diskUv;
void main() {
	diskUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const galaxyCloudFragmentShader = `
varying vec2 diskUv;
float hash(vec2 p) {
	vec3 q = fract(vec3(p.xyx) * 0.1031);
	q += dot(q, q.yzx + 33.33);
	return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
	vec2 cell = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
		mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), f.x), f.y);
}
float cloud(vec2 p) {
	float value = 0.0;
	float amplitude = 0.5;
	for (int i = 0; i < 4; i++) {
		value += noise(p) * amplitude;
		p = mat2(1.6, -1.2, 1.2, 1.6) * p + 8.7;
		amplitude *= 0.5;
	}
	return value;
}
void main() {
	vec2 p = (diskUv - 0.5) * 2.0;
	float r = length(p);
	if (r > 1.0) discard;
	float angle = atan(p.y, p.x);
	float billow = cloud(p * 8.0);
	float grain = noise(p * 125.0);
	float fade = 1.0 - smoothstep(0.62, 1.0, r);
	float bands = 0.5 + 0.5 * cos(angle * 2.0 - r * 7.0 + billow * 0.8);
	float disk = exp(-r * 3.1) * (0.68 + bands * 0.32);
	disk *= (0.65 + billow * 0.8) * fade;
	// Broken dust lanes wrap through the disk without separated pinwheel arms.
	float lane = pow(0.5 + 0.5 * sin(r * 28.0 - angle * 2.0 + billow * 4.0), 6.0);
	float dust = lane * smoothstep(0.12, 0.3, r) * (0.55 + billow * 0.45);
	dust *= 0.5 + 0.5 * smoothstep(-0.2, 0.5, -p.y);
	vec3 blue = vec3(0.20, 0.36, 0.58);
	vec3 amber = vec3(0.77, 0.48, 0.24);
	vec3 tint = mix(blue, amber, exp(-r * 4.0));
	tint *= 0.62 + billow * 0.8 + grain * 0.12;
	tint = mix(tint, vec3(0.10, 0.044, 0.021), dust * 0.78);
	float nebula = pow(max(0.0, noise(p * 31.0) - 0.54) * 2.17, 3.0);
	nebula *= bands * smoothstep(0.25, 0.48, r) * (1.0 - smoothstep(0.7, 0.9, r));
	tint += vec3(0.62, 0.075, 0.18) * nebula * 1.6;
	// A thicker bulge and soft ivory nucleus, rather than a dense point cluster.
	float bulgeRadius = length(p * vec2(1.0, 0.57));
	float bulge = exp(-bulgeRadius * 11.0);
	float nucleus = exp(-bulgeRadius * bulgeRadius * 1600.0);
	tint = mix(tint, vec3(1.0, 0.77, 0.47), min(bulge * 2.0, 0.85));
	tint += vec3(0.85, 0.88, 0.91) * nucleus;
	float opacity = (1.0 - exp(-disk * 2.8 - bulge * 2.0)) * fade;
	gl_FragColor = vec4(tint, opacity);
	#include <colorspace_fragment>
}`;
