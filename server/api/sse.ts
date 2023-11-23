import { hooks } from "~/server/utils/hooks";

export default defineEventHandler(async (e) => {
	setHeader(e, "cache-control", "no-cache");
	setHeader(e, "connection", "keep-alive");
	setHeader(e, "content-type", "text/event-stream");
	setResponseStatus(e, 200);

	const sendEvent = (data: "chats" | "messages") => {
		e.node.res.write(`data: ${data}`);
	};

	hooks.hook("sse:event", sendEvent);

	e._handled = true;
});
