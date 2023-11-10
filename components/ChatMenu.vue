<script setup lang="ts">
const isOpen = useChatMenu();
const selectedChat = useChat();

const { data: chats, pending } = await useLazyAsyncData("chats", () =>
	$fetch("/api/chats")
);

function selectChat(chat: string) {
	selectedChat.value.id = chat;
	console.log(selectedChat.value);
}
async function newChat() {}
</script>

<template>
	<aside :class="isOpen ? 'chat-menu open' : 'chat-menu'">
		<button class="new-chat" @click="newChat">
			<span>New Chat</span>
			<Icon name="material-symbols:chat-add-on-rounded" size="1.5em" />
		</button>
		<div class="chat-list">
			<div v-if="pending">Loading...</div>
			<div v-else-if="!chats?.length">No chats found</div>
			<button
				:key="chat.id"
				v-else
				v-for="chat in chats"
				@click="() => selectChat(chat.id)"
			>
				<span>{{ chat.name }}</span>
				<Icon name="material-symbols:delete-rounded" size="1.5em" />
			</button>
		</div>
	</aside>
</template>

<style lang="scss">
.chat-menu {
	flex-direction: column;
	background-color: var(--bg-primary);
	font-size: 1.125em;
	border-right: 1px solid var(--bg-raise);

	.icon {
		filter: drop-shadow(1px 1px 1px black);
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
	background-color: var(--bg-raise);
	border-bottom: 1px solid var(--bg-raise);

	* {
		text-overflow: ellipsis;
		overflow: hidden;
	}
}
</style>
