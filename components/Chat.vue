<script setup lang="ts">
const auth = useAuth();
const chat = useChat();
const sse = useSSE();
const keyPair = useKeyPair();

const newMessage = ref("");
const now = ref(0);
const interval = ref(0);
const refreshCounter = ref(0);

const {
	data: messages,
	execute: getMessages,
	refresh: refreshMessages
} = await useLazyAsyncData(
	() =>
		$fetch("/api/messages", {
			query: {
				chatId: chat.value?.id,
				deviceId: auth.value.currentDevice?.id
			},
			onResponse({ response }) {
				if (response.redirected) {
					navigateTo("/login");
					return;
				}
			}
		})
			.then(async (data) => {
				for (let i = 0, len = data.length; i < len; i++) {
					console.log(new TextEncoder().encode(data[i].content));
					data[i].content = await decryptMessage(data[i].content);
				}

				return data;
			})
			.catch(console.error),
	{
		server: false,
		immediate: false
	}
);

watch(chat, () => getMessages());

async function sendMessage() {
	if (!chat.value || !newMessage.value) return;

	if (!keyPair.value || !keyPair.value.publicKey)
		return reloadNuxtApp({ force: true });

	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const currentChat = chat.value;

	currentChat.members.forEach((member) => {
		member.devices.forEach(async (device) => {
			const publicKey = await crypto.subtle.importKey(
				"jwk",
				JSON.parse(device.key),
				{ name: "RSA-OAEP", hash: "SHA-256" },
				true,
				["encrypt"]
			);

			const encryptedMessageBuffer = await crypto.subtle.encrypt(
				{ name: "RSA-OAEP" },
				publicKey,
				encoder.encode(newMessage.value)
			);

			const encryptedMessage = decoder.decode(encryptedMessageBuffer);

			await useFetch("/api/messages", {
				method: "post",
				body: {
					chat: currentChat.id,
					message: encryptedMessage,
					deviceId: device.id
				}
			});
		});
	});

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

function decryptMessage(content: string) {
	if (!keyPair.value) {
		console.error("Key pair is null. Reload needed");
		reloadNuxtApp({ force: true });
		return new Promise<string>((res) => res("Encrypted data"));
	}

	console.info(keyPair.value.privateKey);

	return crypto.subtle
		.decrypt(
			{ name: "RSA-OAEP" },
			keyPair.value.privateKey,
			new TextEncoder().encode(content)
		)
		.then((decryptedMessageBuffer) => {
			console.log(decryptedMessageBuffer);

			const decryptedMessage = new TextDecoder().decode(decryptedMessageBuffer);

			console.log(decryptedMessage);
			return decryptedMessage;
		})
		.catch((err) => {
			console.error(err);
			return "Encrypted data";
		});
}

onMounted(() => {
	const textField = document.getElementById("chat__textfield");

	if (textField) {
		textField.onkeydown = (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		};
	}

	if (sse.value) {
		sse.value.onmessage = async (e) => {
			await refreshMessages({ dedupe: true });
		};
	}

	interval.value = window.setInterval(() => {
		now.value = Date.now();
		// if (refreshCounter.value % 10 === 0) refreshMessages({ dedupe: true });
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