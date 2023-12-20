export default defineNuxtPlugin(() => {
	if (process.server) return;

	const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";

	const socket = new WebSocket(`${wsProtocol}${window.location.host}`);

	return { provide: { socket } };
});
