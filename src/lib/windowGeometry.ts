export interface WindowFrame {
	x: number;
	y: number;
	width: number;
	height: number;
}
export interface DesktopSize {
	width: number;
	height: number;
}

export function fitFrame(frame: WindowFrame, bounds: DesktopSize): WindowFrame {
	const width = Math.min(frame.width, bounds.width);
	const height = Math.min(frame.height, bounds.height);
	return {
		width,
		height,
		x: Math.max(0, Math.min(frame.x, bounds.width - width)),
		y: Math.max(0, Math.min(frame.y, bounds.height - height)),
	};
}

export function initialFrame(id: string, bounds: DesktopSize): WindowFrame {
	const width = id === "finder" ? 850 : id === "contact" ? 510 : 650;
	const height = id === "finder" ? 650 : 580;
	return fitFrame(
		{
			width,
			height,
			x: Math.max(
				24,
				(bounds.width - width) / 2 - (id === "finder" ? 45 : -45),
			),
			y: Math.max(30, (bounds.height - height) / 2 - 8),
		},
		bounds,
	);
}
