import { worldToCanvas } from './utils.js';

export const updateTooltip = (elements, state, player) => {
	if (!player) {
		elements.tooltip.classList.add("hidden");
		return;
	}

	const name = player.username ?? "Unknown";

	const playerElement = elements.tooltip.querySelector("#player div");
	if (playerElement) playerElement.textContent = name;

	const destinationSection = elements.tooltip.querySelector("#destination");
	const trainNameSection = elements.tooltip.querySelector("#train-name");
	const headcodeSection = elements.tooltip.querySelector("#headcode");
	const trainClassSection = elements.tooltip.querySelector("#train-class");

	if (player.trainData && Array.isArray(player.trainData)) {
		const [destination, trainClass, headcode] = player.trainData;

		const setupSection = (section, value) => {
			if (value && value !== "Unknown" && value !== "----" && value !== "" && section) {
				const div = section.querySelector("div");
				if (div) div.textContent = value;
				section.style.display = "flex";
			} else if (section) {
				section.style.display = "none";
			}
		};

		setupSection(destinationSection, destination);
		setupSection(trainClassSection, trainClass);
		setupSection(headcodeSection, headcode);
		if (trainNameSection) trainNameSection.style.display = "none";

	} else {
		[destinationSection, trainNameSection, headcodeSection, trainClassSection].forEach((section) => {
			if (section) section.style.display = "none";
		});
	}

	const playerSection = elements.tooltip.querySelector("#player");
	if (playerSection) playerSection.style.display = "flex";

	const serverSection = elements.tooltip.querySelector("#server");
	if (serverSection && state.currentServer === "all") {
		const serverDiv = serverSection.querySelector("div");
		if (serverDiv) {
			let serverName = "Unknown";
			for (const [jobId, serverInfo] of Object.entries(state.serverData)) {
				if (serverInfo.players && serverInfo.players.includes(player)) {
					serverName = jobId.length > 6 ? jobId.substring(jobId.length - 6) : jobId;
					break;
				}
			}
			serverDiv.textContent = serverName;
		}
		serverSection.style.display = "flex";
	} else if (serverSection) {
		serverSection.style.display = "none";
	}

	const { canvas, context } = elements;
	const worldX = player.position?.x ?? 0;
	const worldY = player.position?.y ?? 0;
	const baseCanvasPos = worldToCanvas(canvas, worldX, worldY);
	const transform = context.getTransform();

	const screenX = baseCanvasPos.x * transform.a + baseCanvasPos.y * transform.c + transform.e;
	const screenY = baseCanvasPos.x * transform.b + baseCanvasPos.y * transform.d + transform.f;

	const canvasRect = canvas.getBoundingClientRect();
	const tooltipX = canvasRect.left + screenX;
	const tooltipY = canvasRect.top + screenY;

	let finalX = tooltipX + 15;
	let finalY = tooltipY - 40;

	elements.tooltip.classList.remove("hidden");
	elements.tooltip.style.visibility = "hidden";

	const tooltipRect = elements.tooltip.getBoundingClientRect();

	if (finalX + tooltipRect.width > window.innerWidth) finalX = tooltipX - tooltipRect.width - 15;
	if (finalY < 0) finalY = tooltipY + 20;
	if (finalY + tooltipRect.height > window.innerHeight) finalY = tooltipY - tooltipRect.height - 20;
	if (finalX < 0) finalX = tooltipX + 15;

	elements.tooltip.style.left = `${finalX}px`;
	elements.tooltip.style.top = `${finalY}px`;
	elements.tooltip.style.visibility = "visible";
};
