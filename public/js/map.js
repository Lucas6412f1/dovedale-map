import { MAP_CONFIG, WORLD_CENTER } from './constants.js';
import { drawScene } from './rendering.js';

export const loadMapImages = (state, context) => {
    const totalImages = MAP_CONFIG.rows * MAP_CONFIG.cols;
	for (let row = 0; row < MAP_CONFIG.rows; row++) {
		state.mapImages[row] = [];
		for (let col = 0; col < MAP_CONFIG.cols; col++) {
			const img = new Image();
			img.src = `/images/row-${row + 1}-column-${col + 1}.png`;

			img.onload = () => {
				state.loadedImages++;
				if (state.loadedImages === 1) {
					initializeMap(state, context);
				} else {
					drawScene(context, state);
				}
			};

			img.onerror = () => {
				console.error(`Failed to load image: ${img.src}`);
				state.loadedImages++;
                if (state.loadedImages === totalImages) {
                    drawScene(context, state);
                }
			};

			state.mapImages[row][col] = img;
		}
	}
};

const initializeMap = (state, context) => {
	const { canvas } = context;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const canvasCenter = worldToCanvas(canvas, WORLD_CENTER.x, WORLD_CENTER.y);
	context.translate(
		window.innerWidth / 2 - canvasCenter.x,
		window.innerHeight / 2 - canvasCenter.y,
	);
	drawScene(context, state);
};

let resizeTimeout = null;
export const handleWindowResize = (context, state) => {
	if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
        const currentTransform = context.getTransform();
        context.canvas.width = window.innerWidth;
        context.canvas.height = window.innerHeight;
        context.setTransform(currentTransform.a, currentTransform.b, currentTransform.c, currentTransform.d, currentTransform.e, currentTransform.f);
        drawScene(context, state);
    }, 16);
};
