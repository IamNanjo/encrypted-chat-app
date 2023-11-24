<script setup lang="ts">
const auth = useAuth();
const isOpen = useChatMenu();
const selectedChat = useChat();

const userSearch = ref("");

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

const { data: users } = await useLazyAsyncData(
	() => $fetch("/api/users", { query: { q: userSearch.value } }),
	{
		server: false,
		watch: [userSearch]
	}
);

function showUserSelect() {
	const modal = document.getElementById("new-chat__modal") as HTMLDialogElement;
	modal.showModal();
}

async function newChat(user: string) {
	await useFetch("/api/chats", {
		method: "post",
		body: { user }
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
		<dialog id="new-chat__modal" class="new-chat__modal">
			<form class="new-chat__form" method="dialog">
				<input
					class="new-chat__search-input"
					v-model="userSearch"
					type="search"
					placeholder="Search"
				/>
				<div class="new-chat__search-results">
					<button
						:key="user.id"
						v-for="user in users"
						@click="() => newChat(user.id)"
					>
						{{ user.username }}
					</button>
				</div>
				<button class="new-chat__cancel" type="submit">Cancel</button>
			</form>
		</dialog>
		<div class="clickable new-chat" @click="showUserSelect">
			<span>New Chat</span>
			<Icon name="material-symbols:chat-add-on-rounded" size="1.5em" />
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

	&.active,
	.active {
		filter: brightness(80%);
	}
}

.new-chat {
	&__modal {
		display: flex;
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
		z-index: -10;

		--border-radius: 6px;

		> * {
			flex: 0;
			width: 80%;
		}

		&::backdrop {
			background-color: #00000066;
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
			cursor: pointer;

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
