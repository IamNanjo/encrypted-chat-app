<script setup lang="ts">
const auth = useAuth();
const isOpen = useChatMenu();
const { $socket } = useNuxtApp();
const selectedChat = useChat();

const userSearch = ref("");

const interval = ref(0);

interface RawChat {
	id: string;
	members: {
		id: string;
		username: string;
		devices: { id: string; key: string }[];
	}[];
}

const { data: chats, execute: getChats } = await useLazyAsyncData(
	"chats",
	async () => {
		const data = await $fetch("/api/chats");
		return parseChats(data);
	},
	{
		server: false,
		immediate: false
	}
);

const { data: users, execute: getUsers } = await useLazyFetch("/api/users", {
	server: false,
	immediate: false,
	query: { q: userSearch.value },
	watch: [userSearch]
});

async function parseChat(rawChat: RawChat): Promise<Chat> {
	let temp: Chat = { id: rawChat.id, members: [] };

	for (let i = 0, iLen = rawChat.members.length; i < iLen; i++) {
		const member = rawChat.members[i];

		temp.members.push({
			id: member.id,
			username: member.username,
			devices: []
		});

		for (let j = 0, jlen = member.devices.length; j < jlen; j++) {
			const device = member.devices[j];
			const parsedKey = await crypto.subtle.importKey(
				"jwk",
				JSON.parse(device.key),
				{ name: "RSA-OAEP", hash: "SHA-512" },
				true,
				["encrypt"]
			);

			temp.members[i].devices.push({ id: device.id, key: parsedKey });
		}
	}

	return temp;
}

async function parseChats(rawChats: RawChat[]): Promise<Chat[]> {
	const temp: Chat[] = [];

	for (let i = 0, len = rawChats.length; i < len; i++) {
		temp.push(await parseChat(rawChats[i]));
	}

	return temp;
}

function showUserSelect() {
	const modal = document.getElementById("new-chat__modal") as HTMLDialogElement;
	modal.showModal();
}

async function newChat(user: string) {
	$fetch("/api/chats", {
		method: "POST",
		body: { user }
	})
		.then(async (res) => {
			isOpen.value = false;
			if (res !== null) {
				selectChat(await parseChat(res));
			}
		})
		.catch(console.error);
}

function selectChat(chat: Chat) {
	selectedChat.value = chat;
	isOpen.value = false;
}

async function deleteChat(e: Event, id: string) {
	e.stopPropagation();

	if (selectedChat.value && selectedChat.value.id === id) {
		selectedChat.value = null;
	}

	await $fetch("/api/chats", { method: "delete", body: { id } });
}

onMounted(() => {
	getUsers();
	getChats();

	$socket.addEventListener("message", async (e) => {
		const message: SocketMessage<RawChat> = JSON.parse(e.data);

		if (message.event !== "chat") return;

		switch (message.mode) {
			case "post":
				chats.value?.unshift(await parseChat(message.data));
				break;

			case "delete":
				break;
		}
	});
});

onBeforeUnmount(() => {
	clearInterval(interval.value);
});
</script>

<template>
	<aside :class="isOpen ? 'chat-menu open' : 'chat-menu'">
		<dialog id="new-chat__modal" class="new-chat__modal">
			<form class="new-chat__form" method="dialog">
				<input
					class="new-chat__search-input"
					v-model="userSearch"
					type="search"
					placeholder="Search"
				/>
				<div class="new-chat__search-results">
					<div v-if="!users || !users.length">No results</div>
					<button
						:key="user.id"
						v-else
						v-for="user in users"
						@click="() => newChat(user.id)"
					>
						{{ user.username }}
					</button>
				</div>
				<button class="new-chat__cancel" type="submit">Cancel</button>
			</form>
		</dialog>
		<div class="clickable new-chat" @click="showUserSelect" tabindex="0">
			<span>New Chat</span>
			<Icon name="material-symbols:chat-add-on-rounded" size="1.5em" />
		</div>
		<div class="chat-list">
			<div v-if="!chats || !chats.length">No chats found</div>
			<button
				v-else
				v-for="chat in chats"
				:key="chat.id"
				:class="selectedChat?.id === chat.id ? 'active' : ''"
				@click="() => selectChat(chat)"
			>
				<span>{{
					chat.members.filter((user) => user.username !== auth.username)[0]
						.username
				}}</span>
				<Icon
					name="material-symbols:delete-rounded"
					size="1.5em"
					@click="(e: Event) => deleteChat(e, chat.id)"
				/>
			</button>
		</div>
	</aside>
</template>

<style lang="scss">
.chat-menu {
	display: flex;
	flex-direction: column;
	background-color: var(--bg-primary);
	font-size: 1.125em;

	.icon {
		flex: 0 0 1.5em;
	}
}

.new-chat,
.chat-list > * {
	display: flex;
	justify-content: space-between;
	width: 100%;
	align-items: center;
	min-height: 2.5559em;
	gap: 0.5em;
	padding: 0.5em 1em;
	background-color: var(--bg-raise-1);
	border-bottom: 1px solid var(--bg-raise);

	&:hover {
		background-color: var(--bg-raise-2);
	}

	* {
		text-overflow: ellipsis;
		overflow: hidden;
	}

	&.active,
	.active {
		filter: brightness(80%);
	}
}

.new-chat {
	&__modal {
		display: none;
		flex-direction: column;
		justify-content: space-around;
		gap: 1em;
		align-items: center;
		position: absolute;
		background-color: var(--bg-raise-1);
		top: 50%;
		left: 50%;
		width: min(30em, 95%);
		height: min(18em, 60%);
		padding: 1em 0;
		font-size: 1.125em;
		border: 1px solid var(--bg-raise);
		border-radius: 12px;
		box-shadow: 1px 1px 4px 2px black;
		transform: translate(-50%, -50%);

		--border-radius: 6px;

		&[open] {
			display: flex;
		}

		> * {
			flex: 0;
			width: 80%;
		}

		&::backdrop {
			background-color: #000000aa;
		}
	}

	&__form {
		display: contents;
	}

	&__search-input {
		width: 60%;
		padding: 0.5em 1em;
		border-radius: var(--border-radius);
		border: 0;
	}

	&__search-results {
		width: 60%;
		max-height: 80%;
		overflow-y: auto;
		overflow-x: hidden;

		> * {
			display: block;
			width: 100%;
			text-align: left;
			background-color: var(--bg-raise);
			padding: 0.5em;
			border: 1px solid var(--bg-raise);
			user-select: none;

			&:first-child {
				border-top-left-radius: var(--border-radius);
				border-top-right-radius: var(--border-radius);
			}

			&:last-child {
				border-bottom-left-radius: var(--border-radius);
				border-bottom-right-radius: var(--border-radius);
			}
		}
	}

	&__cancel {
		display: block;
		background-color: var(--fg-primary);
		padding: 0.5em 3em;
		border-radius: 6px;
	}
}
</style>
