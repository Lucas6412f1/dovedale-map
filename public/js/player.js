import { worldToCanvas } from './utils.js';

export const getPlayerAtPosition = (context, state, canvasX, canvasY) => {
	const playersToCheck = state.getAllPlayers();

	for (const player of playersToCheck) {
		const worldX = player.position?.x ?? 0;
		const worldY = player.position?.y ?? 0;

		const baseCanvasPos = worldToCanvas(context.canvas, worldX, worldY);
		const transform = context.getTransform();

		const screenX =
			baseCanvasPos.x * transform.a +
			baseCanvasPos.y * transform.c +
			transform.e;
		const screenY =
			baseCanvasPos.x * transform.b +
			baseCanvasPos.y * transform.d +
			transform.f;

		const baseRadius = 3;
		const scaleFactor = Math.max(0.3, 1 / Math.pow(state.currentScale, 0.4));
		const hitRadius = baseRadius * scaleFactor * Math.abs(transform.a);

		const distance = Math.hypot(screenX - canvasX, screenY - canvasY);

		if (distance <= hitRadius) return player;
	}

	return null;
};
