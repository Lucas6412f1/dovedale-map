import { AppState } from './state.js';
import { MAP_CONFIG } from './constants.js';
import { drawScene } from './rendering.js';

export const trackTransforms = (context, state) => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	let transform = svg.createSVGMatrix();

	context.getTransform = () => transform;

	const savedTransforms = [];
	const original = {
		save: context.save,
		restore: context.restore,
		scale: context.scale,
		translate: context.translate,
	};

	context.save = function () {
		savedTransforms.push(transform.translate(0, 0));
		return original.save.call(context);
	};

	context.restore = function () {
		transform = savedTransforms.pop();
		return original.restore.call(context);
	};

	context.scale = function (sx, sy) {
		transform = transform.scaleNonUniform(sx, sy);
		state.currentScale *= sx;
		return original.scale.call(context, sx, sy);
	};

	context.translate = function (dx, dy) {
		transform = transform.translate(dx, dy);
		return original.translate.call(context, dx, dy);
	};

	const point = svg.createSVGPoint();
	context.transformedPoint = function (x, y) {
		point.x = x;
		point.y = y;
		return point.matrixTransform(transform.inverse());
	};
};

export const zoomAt = (context, state, screenX, screenY, scaleFactor) => {
	const point = context.transformedPoint(screenX, screenY);
	context.translate(point.x, point.y);
	context.scale(scaleFactor, scaleFactor);
	context.translate(-point.x, -point.y);

	state.currentScale *= scaleFactor;
	drawScene(context, state);
};
