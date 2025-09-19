// Application State
export class AppState {
	constructor() {
		this.serverData = {};
		this.currentServer = "all";
		this.hoveredPlayer = null;
		this.isDragging = false;
		this.dragStart = null;
		this.currentScale = 1;
		this.lastTouchDistance = 0;
		this.ws = null;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 3;
		this.reconnectTimeout = null;
		this.mapImages = [];
		this.loadedImages = 0;
		this.staleCheckInterval = null;
	}

	getAllPlayers() {
		if (this.currentServer === "all") {
			return Object.values(this.serverData)
				.map(serverInfo => serverInfo.players || [])
				.flat();
		}
		return this.serverData[this.currentServer]?.players || [];
	}
}
