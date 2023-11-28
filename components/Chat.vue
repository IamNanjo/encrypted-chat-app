<script setup lang="ts">
const auth = useAuth();
const chat = useChat();
const keyPair = useKeyPair();

const newMessage = ref("");
const now = ref(0);
const interval = ref(0);
const refreshCounter = ref(0);

import type { Message } from "~/server/api/messages.get";

const {
	data: messages,
	execute: getMessages,
	refresh: refreshMessages
} = await useLazyAsyncData(
	async (): Promise<Message[]> => {
		const data = await $fetch("/api/messages", {
			query: {
				chatId: chat.value?.id,
				deviceId: auth.value.currentDevice?.id
			}
		});

		for (let i = 0, len = data.length; i < len; i++) {
			data[i].content = await decryptMessage(data[i].content);
		}

		return data;
	},

	{
		server: false,
		immediate: false,
		default: (): Message[] => []
	}
);

watch(chat, (newChat) => {
	if (newChat && newChat.id && keyPair.value) getMessages();
	else if (!newChat) messages.value = [] as Message[];
});

watch(messages, () => {
	const scrollContainer = document.getElementById(
		"chat__messages"
	) as HTMLDivElement;

	scrollContainer.scrollTo({
		top: scrollContainer.scrollHeight,
		behavior: "smooth"
	});
});

async function sendMessage() {
	if (!chat.value || !newMessage.value) return;

	if (!keyPair.value || !keyPair.value.publicKey)
		return reloadNuxtApp({ force: true });

	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	// Encrypt message using each device of each chat member and send it
	for (let i = 0, iLen = chat.value.members.length; i < iLen; i++) {
		const member = chat.value.members[i];

		for (let j = 0, jLen = member.devices.length; j < jLen; j++) {
			const device = member.devices[j];

			const encryptedMessageBuffer = await crypto.subtle.encrypt(
				{ name: "RSA-OAEP" },
				device.key,
				encoder.encode(newMessage.value)
			);

			const encryptedMessage = decoder.decode(encryptedMessageBuffer);

			await useFetch("/api/messages", {
				method: "post",
				body: {
					chat: chat.value.id,
					message: encryptedMessage,
					deviceId: device.id
				}
			});
		}
	}

	await refreshMessages({ dedupe: true });

	newMessage.value = "";

	const scrollContainer = document.getElementById(
		"chat__messages"
	) as HTMLDivElement;

	scrollContainer.scrollTo({
		top: scrollContainer.scrollHeight,
		behavior: "smooth"
	});
}

function getRelativeTime(timestamp: string) {
	const pastTime = new Date(timestamp).getTime();

	// Time difference in different units
	const seconds = Math.floor((now.value - pastTime) / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	// Return formatted string
	if (days >= 1) return `${days} ${days > 1 ? "days" : "day"} ago`;
	if (hours >= 1) return `${hours} ${hours > 1 ? "hours" : "hour"} ago`;
	if (minutes >= 1)
		return `${minutes} ${minutes > 1 ? "minutes" : "minute"} ago`;

	if (seconds < 10) return "just now";

	return `${seconds} ${seconds > 1 ? "seconds" : "second"} ago`;
}

async function decryptMessage(encryptedContent: string) {
	if (!keyPair.value) {
		reloadNuxtApp({ force: true });
		return encryptedContent;
	}

	return crypto.subtle
		.decrypt(
			{ name: "RSA-OAEP" },
			keyPair.value.privateKey,
			new TextEncoder().encode(encryptedContent)
		)
		.then((decryptedMessageBuffer) => {
			const decryptedMessage = new TextDecoder().decode(decryptedMessageBuffer);
			return decryptedMessage;
		})
		.catch(() => {
			return encryptedContent;
		});
}

onMounted(() => {
	const textField = document.getElementById(
		"chat__textfield"
	) as HTMLTextAreaElement;

	textField.onkeydown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	interval.value = window.setInterval(() => {
		now.value = Date.now();
		if (chat.value && keyPair.value && refreshCounter.value % 4 === 0)
			refreshMessages({ dedupe: true });
		refreshCounter.value++;
	}, 500);
});

onBeforeUnmount(() => {
	if (interval.value) clearInterval(interval.value);
});
</script>

<template>
	<div class="chat">
		<div id="chat__messages" class="chat__messages">
			<div v-for="message in messages" :key="message.id" class="chat__message">
				<div class="chat__message-info">
					{{ message.sender.username || "Deleted user" }} -
					{{ getRelativeTime(message.created) }}
				</div>
				<div class="chat__message-content">
					{{ message.content }}
				</div>
			</div>
		</div>
		<form class="chat__new-message" @submit.prevent="sendMessage">
			<textarea
				required
				:disabled="!chat || !chat.id"
				id="chat__textfield"
				class="chat__textfield"
				placeholder="Enter text here..."
				cols="30"
				rows="1"
				v-model="newMessage"
			></textarea>
			<button
				:disabled="!chat || !chat.id"
				class="chat__send-message"
				type="submit"
				title="Send"
			>
				<Icon name="material-symbols:send-rounded" size="2em" />
			</button>
		</form>
	</div>
</template>

<style lang="scss">
.chat {
	position: relative;
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 1em;
	background-color: var(--bg-primary);
	justify-content: center;
	padding: 1em;

	--border-radius: 6px;

	&__messages {
		display: flex;
		position: relative;
		flex-direction: column;
		gap: 1em;
		width: 100%;
		height: 100%;
		padding-right: 0.5em;
		overflow-x: hidden;
		text-overflow: ellipsis;
		overflow-y: auto;
	}

	&__message {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 1em;
		border-radius: var(--border-radius);
		background-color: var(--bg-raise);

		&-info {
			color: var(--text-muted);
			width: max-content;
			overflow: hidden;
			user-select: none;
		}

		&-content {
			overflow-wrap: break-word;
			word-wrap: break-word;
			word-break: break-all;
		}
	}

	&__new-message {
		display: flex;
		height: max-content;
	}

	&__textfield {
		background-color: var(--bg-raise);
		flex: 1;
		font-size: 1.5em;
		height: max-content;
		max-height: 5em;
		padding: 0.25em;
		border-top-left-radius: var(--border-radius);
		border-bottom-left-radius: var(--border-radius);
		resize: none;
	}

	&__send-message {
		background-color: var(--fg-primary);
		padding-inline: 0.25em;
		border-top-right-radius: var(--border-radius);
		border-bottom-right-radius: var(--border-radius);

		.icon {
			color: white;
		}
	}

	&__menu.open + .chat {
		padding: 0;
	}
}
</style>
