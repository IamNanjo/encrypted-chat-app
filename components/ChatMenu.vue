<script setup lang="ts">
const auth = useAuth();
const isOpen = useChatMenu();
const selectedChat = useChat();

const {
	data: chats,
	pending,
	refresh: refreshChats
} = await useLazyAsyncData(
	() =>
		$fetch("/api/chats", {
			onResponse({ response }) {
				if (response.redirected) {
					navigateTo("/login");
					return;
				}
			}
		}),
	{ server: false }
);

async function newChat() {
	await useFetch("/api/chats", {
		method: "post",
		body: {
			user: "27ae1441-e5ea-44ec-8771-9c644d1141c0"
		}
	});

	await refreshChats({ dedupe: true });
}

async function deleteChat(id: string) {
	if (selectedChat.value && selectedChat.value.id === id) {
		selectedChat.value = null;
	}
	await useFetch("/api/chats", { method: "delete", body: { id } });
	await refreshChats({ dedupe: true });
}
</script>

<template>
	<aside :class="isOpen ? 'chat-menu open' : 'chat-menu'">
		<div class="clickable new-chat" @click="newChat">
			<span>New Chat</span>
			<Icon name="material-symbols:chat-add-on-rounded" size="1.5em" />
			<div class="popup"></div>
		</div>
		<div class="chat-list">
			<div v-if="pending">Loading...</div>
			<div v-else-if="!chats || !chats.length">No chats found</div>
			<button
				v-else
				v-for="chat in chats"
				:key="chat.id"
				:class="selectedChat?.id === chat.id ? 'active' : ''"
				@click="() => (selectedChat = chat)"
			>
				<span>{{
					chat.members.filter((user) => user.username !== auth.username)[0]
						.username
				}}</span>
				<Icon
					name="material-symbols:delete-rounded"
					size="1.5em"
					@click="() => deleteChat(chat.id)"
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
}

.chat-list .active {
	filter: brightness(80%);
}

.new-chat {
	.popup {
		display: none;
		position: absolute;
		background-color: var(--bg-raise);
		top: 50%;
		left: 50%;
		width: min(30em, 95%);
		margin-top: 3em;
		min-height: min(14em, 60%);
		border-radius: 12px;
		box-shadow: 1px 1px 4px 2px black;
		transform: translate(-50%, -50%);
	}

	:focus-within .popup,
	.popup:hover {
		display: flex;
	}
}
</style>
