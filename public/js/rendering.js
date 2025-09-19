import { MAP_CONFIG, AREA_MARKERS } from './constants.js';
import { worldToCanvas, getPlayerColor } from './utils.js';

export const drawScene = (context, state) => {
	const { canvas } = context;
	const transformedP1 = context.transformedPoint(0, 0);
	const transformedP2 = context.transformedPoint(canvas.width, canvas.height);
	context.clearRect(
		transformedP1.x,
		transformedP1.y,
		transformedP2.x - transformedP1.x,
		transformedP2.y - transformedP1.y,
	);

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

	const chunkWidth = MAP_CONFIG.totalWidth / MAP_CONFIG.cols;
	const chunkHeight = MAP_CONFIG.totalHeight / MAP_CONFIG.rows;
	const scaledChunkWidth = chunkWidth * scaleFactor;
	const scaledChunkHeight = chunkHeight * scaleFactor;

	context.imageSmoothingEnabled = false;
	for (let row = 0; row < MAP_CONFIG.rows; row++) {
		for (let col = 0; col < MAP_CONFIG.cols; col++) {
			const img = state.mapImages[row]?.[col];
			if (img?.complete) {
				const destX = offsetX + col * scaledChunkWidth;
				const destY = offsetY + row * scaledChunkHeight;

				const overlap = Math.max(0.5, 2 / state.currentScale);
				const drawWidth = scaledChunkWidth + (col < MAP_CONFIG.cols - 1 ? overlap : 0);
				const drawHeight = scaledChunkHeight + (row < MAP_CONFIG.rows - 1 ? overlap : 0);

				context.drawImage(img, 0, 0, img.width, img.height, destX, destY, drawWidth, drawHeight);
			}
		}
	}
	context.imageSmoothingEnabled = true;

	const playersToShow = state.getAllPlayers();
	document.getElementById("players").innerHTML = `Players: ${playersToShow.length}`;

	const dotScaleFactor = Math.max(0.3, 1 / Math.pow(state.currentScale, 0.4));

	playersToShow.forEach((player) => {
		const worldX = player.position?.x ?? 0;
		const worldY = player.position?.y ?? 0;
		const name = player.username ?? "Unknown";

		const canvasPos = worldToCanvas(canvas, worldX, worldY);
		const isHovered = state.hoveredPlayer?.username === name;
		const baseRadius = isHovered ? 2.5 : 2;
		const radius = baseRadius * dotScaleFactor;

		context.fillStyle = getPlayerColor(name);
		context.beginPath();
		context.arc(canvasPos.x, canvasPos.y, radius, 0, Math.PI * 2);
		context.fill();

		context.strokeStyle = isHovered ? "white" : "black";
		context.lineWidth = Math.max((isHovered ? 0.7 : 0.4) * scaleFactor, 0.25);
		context.stroke();
	});

	if (state.currentScale > 300) return;
	const markerFontSize = Math.max(0.2, 10 / Math.pow(state.currentScale, 0.3));
	Object.entries(AREA_MARKERS).forEach(([name, { x, y }]) => {
		const canvasPos = worldToCanvas(canvas, x, y);
		context.fillStyle = "white";
		context.font = markerFontSize + "px Inter";
		const textDimensions = context.measureText(name);
		context.fillText(
			name,
			canvasPos.x - textDimensions.width / 2,
			canvasPos.y,
		);
	});
};

export const updateServerList = (elements, state, data = null) => {
	const { serverSelect } = elements;
	const currentServers = Object.keys(state.serverData);

	if (data?.players) {
		const playersArray = Array.isArray(data.players) ? data.players : [];
		
		playersArray.forEach((player) => {
			if (player.trainData && !Array.isArray(player.trainData)) {
				const td = player.trainData;
				if (typeof td === "object" && td !== null) {
					player.trainData = [
						td.destination || "Unknown",
						td.class || "Unknown", 
						td.headcode || "----",
						td.headcodeClass || "",
					];
				} else {
					player.trainData = null;
				}
			}
		});
	}

	const selectedValue = serverSelect.value;
	const totalPlayersCount = Object.values(state.serverData).reduce(
		(count, serverInfo) =>
			count + (Array.isArray(serverInfo.players) ? serverInfo.players.length : 0),
		0,
	);

	let html = `<option value="all">All Servers (${totalPlayersCount} players)</option>`;

	currentServers.forEach((jobId) => {
		const serverName = jobId.length > 6 ? `Server ${jobId.substring(jobId.length - 6)}` : `Server ${jobId}`;
		const playerCount = Array.isArray(state.serverData[jobId]?.players) ? state.serverData[jobId].players.length : 0;
		const selected = selectedValue === jobId ? " selected" : "";
		html += `<option value="${jobId}"${selected}>${serverName} (${playerCount} / 50 players)</option>`;
	});

	serverSelect.innerHTML = html;

	if (selectedValue !== "all" && !currentServers.includes(selectedValue)) {
		serverSelect.value = "all";
		state.currentServer = "all";
	} else {
		serverSelect.value = selectedValue;
	}
};
