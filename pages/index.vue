<script setup lang="ts">
const auth = useAuth();

onMounted(() => {
	watch(auth, (newAuth) => {
		if (!newAuth.authenticated) return navigateTo("/login");
	});
});
</script>

<template>
	<main>
		<ChatMenu />
		<Chat />
	</main>
</template>

<style lang="scss">
.chat-menu {
	flex-basis: 0;
	min-width: 0;
	transition: flex 0.2s ease;
	overflow-x: hidden;
	overflow-y: auto;
	text-wrap: nowrap;

	&.open {
		flex-basis: 100%;
	}
}

.chat-menu,
.chat {
	height: calc(100vh - 3em);
	height: calc(100svh - 3em);
}

.chat {
	flex-basis: 100%;
}

.chat-menu.open + .chat {
	flex-basis: 0;
	padding: 0;
}

@media screen and (min-width: 800px) {
	.mobile-menu {
		display: block;

		&__toggle {
			transform: translateX(-5em) rotate(-90deg);
		}
	}

	.chat-menu {
		border-right: 1px solid var(--bg-raise);

		& + .chat {
			flex-basis: 100%;
		}
	}

	.chat-menu,
	.chat-menu.open {
		flex-basis: 16em;
	}
}
</style>
