import { STALE_SERVER_TIMEOUT } from './constants.js';
import { drawScene, updateServerList } from './rendering.js';

const cleanupStaleServers = (state, elements) => {
	const now = Date.now();
	let hasStaleServers = false;
	
	for (const [jobId, serverInfo] of Object.entries(state.serverData)) {
		if (now - serverInfo.lastUpdate > STALE_SERVER_TIMEOUT) {
			console.log(`Removing stale server: ${jobId}`);
			delete state.serverData[jobId];
			hasStaleServers = true;
		}
	}
	
	if (hasStaleServers) {
		updateServerList(elements, state);
		drawScene(elements.context, state);
	}
};

const startStaleServerCleanup = (state, elements) => {
	if (state.staleCheckInterval) {
		clearInterval(state.staleCheckInterval);
	}
	console.log("Starting stale server cleanup loop");
	state.staleCheckInterval = setInterval(() => cleanupStaleServers(state, elements), 5000);
};

const stopStaleServerCleanup = (state) => {
	if (state.staleCheckInterval) {
		console.log("Stopping stale server cleanup loop");
		clearInterval(state.staleCheckInterval);
		state.staleCheckInterval = null;
	}
};

export const createWebSocket = (state, elements) => {
	if (state.reconnectTimeout) {
		clearTimeout(state.reconnectTimeout);
		state.reconnectTimeout = null;
	}

	if (state.ws) {
		state.ws.close();
		state.ws = null;
	}
	
	state.ws = new WebSocket(`wss://${window.location.host}/ws`);

	state.ws.addEventListener("open", () => {
		console.log("WebSocket connected");
		state.reconnectAttempts = 0;
		hideConnectionPopup(elements);
		startStaleServerCleanup(state, elements);
	});

	state.ws.addEventListener("message", (event) => {
		try {
			const data = JSON.parse(event.data);
			const jobId = data.jobId;
			const playersArray = Array.isArray(data.players) ? data.players : [];

			if (playersArray.length === 0 && data.serverShutdown) {
				delete state.serverData[jobId];
			} else {
				state.serverData[jobId] = {
					players: playersArray,
					lastUpdate: Date.now()
				};
			}
			updateServerList(elements, state, data);
			drawScene(elements.context, state);
		} catch (err) {
			console.error("Error parsing data", err);
		}
	});

	state.ws.addEventListener("error", (err) => {
		console.warn("WebSocket error:", err);
	});

	state.ws.addEventListener("close", (event) => {
		console.warn("WebSocket closed:", event.code, event.reason);
		showConnectionPopup(elements, state);
		stopStaleServerCleanup(state);

		if (state.reconnectAttempts < state.maxReconnectAttempts && !state.reconnectTimeout) {
			state.reconnectTimeout = setTimeout(() => {
				state.reconnectTimeout = null;
				attemptReconnect(state, elements);
			}, 1000);
		}
	});

	return state.ws;
};

const showConnectionPopup = (elements, state) => {
	elements.connectionPopup.classList.remove("opacity-0", "-translate-y-5", "pointer-events-none");
	elements.connectionPopup.classList.add("opacity-100", "translate-y-0");
	updateReconnectButton(elements, state);
};

const hideConnectionPopup = (elements) => {
	elements.connectionPopup.classList.add("opacity-0", "-translate-y-5", "pointer-events-none");
	elements.connectionPopup.classList.remove("opacity-100", "translate-y-0");

	elements.reconnectBtn.disabled = false;
	elements.reconnectBtn.classList.remove("bg-zinc-600");
	elements.reconnectBtn.classList.add("bg-blue-600", "hover:bg-blue-700");

	const reconnectIcon = document.getElementById("reconnectIcon");
	if (reconnectIcon) {
		reconnectIcon.classList.remove("animate-spin");
	}

	elements.reconnectBtn.innerHTML = `
    <i id="reconnectIcon" class="material-symbols-outlined text-4">refresh</i>
    Reconnect
  `;
};

const updateReconnectButton = (elements, state) => {
	if (state.reconnectAttempts >= state.maxReconnectAttempts) {
		elements.reconnectBtn.innerHTML = `
      <i id="reconnectIcon" class="material-symbols-outlined text-4">refresh</i>
      Reconnect
    `;
		elements.reconnectBtn.disabled = false;
		elements.reconnectBtn.classList.remove("bg-zinc-600");
		elements.reconnectBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
	}
};

export const attemptReconnect = (state, elements) => {
	if (state.reconnectTimeout) {
		return;
	}

	if (state.reconnectAttempts >= state.maxReconnectAttempts) {
		updateReconnectButton(elements, state);
		return;
	}

	state.reconnectAttempts++;

	elements.reconnectBtn.disabled = true;
	elements.reconnectBtn.classList.add("bg-zinc-600");
	elements.reconnectBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");

	elements.reconnectBtn.innerHTML = `
		<i id="reconnectIcon" class="material-symbols-outlined text-4 animate-spin">refresh</i>
		Connecting...
	`;

	if (state.ws && state.ws.readyState !== WebSocket.CLOSED) {
		state.ws.close();
	}
	
	createWebSocket(state, elements);
};
