import { AppState } from './js/state.js';
import { trackTransforms } from './js/canvas.js';
import { loadMapImages, handleWindowResize } from './js/map.js';
import { handleMouseEvents, handleTouchEvents, addEventListeners } from './js/events.js';
import { createWebSocket } from './js/websocket.js';
import { drawScene, updateServerList } from './js/rendering.js';

const init = () => {
    const canvas = document.querySelector("canvas");
    const context = canvas.getContext("2d");

    const elements = {
        canvas,
        context,
        players: document.getElementById("players"),
        tooltip: document.getElementById("tooltip"),
        serverSelect: document.getElementById("servers"),
        connectionPopup: document.getElementById("connectionPopup"),
        reconnectBtn: document.getElementById("reconnectBtn"),
    };

    const state = new AppState();

    trackTransforms(context, state);
    loadMapImages(state, context);
    handleMouseEvents(context, state, elements);
    handleTouchEvents(context, state, elements);
    addEventListeners(elements, state);

    window.addEventListener('resize', () => handleWindowResize(context, state));

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    drawScene(context, state);
    updateServerList(elements, state);
    createWebSocket(state, elements);
};

init();
