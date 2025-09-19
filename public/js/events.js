import { getCanvasCoordinates, getDistanceBetweenTouches } from './utils.js';
import { zoomAt } from './canvas.js';
import { getPlayerAtPosition } from './player.js';
import { updateTooltip } from './tooltip.js';
import { drawScene } from './rendering.js';
import { attemptReconnect } from './websocket.js';

export const handleMouseEvents = (context, state, elements) => {
	const { canvas } = context;
	canvas.addEventListener("mousedown", (event) => {
		const mousePos = getCanvasCoordinates(canvas, event);
		state.dragStart = context.transformedPoint(mousePos.x, mousePos.y);
		state.isDragging = true;
		return false;
	});

	canvas.addEventListener("mousemove", (event) => {
		if (state.isDragging) {
			if (state.hoveredPlayer) {
				state.hoveredPlayer = null;
				elements.tooltip.classList.add("hidden");
			}

			const mousePos = getCanvasCoordinates(canvas, event);
			const currentPoint = context.transformedPoint(mousePos.x, mousePos.y);
			const dx = currentPoint.x - state.dragStart.x;
			const dy = currentPoint.y - state.dragStart.y;

			context.translate(dx, dy);
			drawScene(context, state);
		} else {
			const mousePos = getCanvasCoordinates(canvas, event);
			const player = getPlayerAtPosition(context, state, mousePos.x, mousePos.y);

			if (player !== state.hoveredPlayer) {
				state.hoveredPlayer = player;
				updateTooltip(elements, state, player);
				drawScene(context, state);
			}
		}
	});

	canvas.addEventListener("mouseleave", () => {
		state.isDragging = false;
		state.dragStart = null;

		if (state.hoveredPlayer) {
			state.hoveredPlayer = null;
			elements.tooltip.classList.add("hidden");
			drawScene(context, state);
		}
	});

	canvas.addEventListener("mouseup", () => {
		state.isDragging = false;
		state.dragStart = null;
	});

	canvas.addEventListener(
		"wheel",
		(event) => {
			event.preventDefault();
			const zoomIntensity = 0.1;
			const scale = event.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
			const mousePos = getCanvasCoordinates(canvas, event);
			zoomAt(context, state, mousePos.x, mousePos.y, scale);
		},
		{ passive: false },
	);
};

export const handleTouchEvents = (context, state, elements) => {
	const { canvas } = context;
	canvas.addEventListener(
		"touchstart",
		(event) => {
			state.hoveredPlayer = null;
			elements.tooltip.classList.add("hidden");

			if (event.touches.length === 1) {
				const touchPos = getCanvasCoordinates(canvas, event.touches[0]);
				state.dragStart = context.transformedPoint(touchPos.x, touchPos.y);
				state.isDragging = true;
			} else if (event.touches.length === 2) {
				state.lastTouchDistance = getDistanceBetweenTouches(event.touches);
			}
		},
		{ passive: false },
	);

	canvas.addEventListener(
		"touchmove",
		(event) => {
			event.preventDefault();

			state.hoveredPlayer = null;
			elements.tooltip.classList.add("hidden");

			if (event.touches.length === 1 && state.isDragging) {
				const touchPos = getCanvasCoordinates(canvas, event.touches[0]);
				const currentPoint = context.transformedPoint(
					touchPos.x,
					touchPos.y,
				);
				const dx = currentPoint.x - state.dragStart.x;
				const dy = currentPoint.y - state.dragStart.y;

				context.translate(dx, dy);
				drawScene(context, state);
			} else if (event.touches.length === 2) {
				const newDistance = getDistanceBetweenTouches(event.touches);
				const scale = newDistance / state.lastTouchDistance;

				const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
				const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

				zoomAt(context, state, centerX, centerY, scale);
				state.lastTouchDistance = newDistance;
			}
		},
		{ passive: false },
	);

	canvas.addEventListener("touchend", (event) => {
		if (event.touches.length < 2) state.lastTouchDistance = 0;
		if (event.touches.length === 0) {
			state.isDragging = false;
			state.dragStart = null;
		}
	});
};

export const addEventListeners = (elements, state) => {
    elements.serverSelect.addEventListener("change", () => {
        state.currentServer = elements.serverSelect.value;
        drawScene(elements.context, state);
    });

    elements.reconnectBtn.addEventListener("click", () => {
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
            state.reconnectTimeout = null;
        }
        
        state.reconnectAttempts = 0;
        attemptReconnect(state, elements);
    });
}
