import { WORLD_BOUNDS, MAP_CONFIG, COLORS } from './constants.js';

export const getCanvasCoordinates = (canvas, event) => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
};

export const getDistanceBetweenTouches = (touches) => {
	const dx = touches[0].clientX - touches[1].clientX;
	const dy = touches[0].clientY - touches[1].clientY;
	return Math.hypot(dx, dy);
};

export const getPlayerColor = (name) => {
	if (!name) return "#00FFFF";

	let value = 0;
	for (let i = 0; i < name.length; i++) {
		const charValue = name.charCodeAt(i);
		let reverseIndex = name.length - i;
		if (name.length % 2 === 1) reverseIndex--;
		value += reverseIndex % 4 >= 2 ? -charValue : charValue;
	}

	const colorIndex = ((value % COLORS.length) + COLORS.length) % COLORS.length;
	return COLORS[colorIndex];
};

export const worldToCanvas = (canvas, worldX, worldY) => {
    const WORLD_WIDTH = WORLD_BOUNDS.BOTTOM_RIGHT.x - WORLD_BOUNDS.TOP_LEFT.x;
    const WORLD_HEIGHT = WORLD_BOUNDS.BOTTOM_RIGHT.y - WORLD_BOUNDS.TOP_LEFT.y;

	const relativeX = (worldX - WORLD_BOUNDS.TOP_LEFT.x) / WORLD_WIDTH;
	const relativeY = (worldY - WORLD_BOUNDS.TOP_LEFT.y) / WORLD_HEIGHT;

	const mapAspectRatio = MAP_CONFIG.totalWidth / MAP_CONFIG.totalHeight;
	const canvasAspectRatio = canvas.width / canvas.height;

	const scaleFactor =
		mapAspectRatio > canvasAspectRatio
			? canvas.width / MAP_CONFIG.totalWidth
			: canvas.height / MAP_CONFIG.totalHeight;

	const scaledMapWidth = MAP_CONFIG.totalWidth * scaleFactor;
	const scaledMapHeight = MAP_CONFIG.totalHeight * scaleFactor;
	const offsetX = (canvas.width - scaledMapWidth) / 2;
	const offsetY = (canvas.height - scaledMapHeight) / 2;

	return {
		x: offsetX + relativeX * scaledMapWidth,
		y: offsetY + relativeY * scaledMapHeight,
	};
};
