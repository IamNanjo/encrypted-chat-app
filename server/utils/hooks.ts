import { createHooks } from "hookable";

interface Hooks {
	"sse:event": (data: "chats" | "messages") => any | void;
}

export const hooks = createHooks<Hooks>();
