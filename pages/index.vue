<script setup lang="ts">
const { session } = await useSession();
const auth = useAuth();

onMounted(async () => {
	// Check session status on page load and update auth state
	watch(session, (newSession) => {
		if (newSession !== null) {
			auth.value = {
				authenticated: "username" in newSession,
				username: newSession.username || ""
			};

			if (!auth.value.authenticated) return navigateTo("/");
		}
	});
});
</script>

<template>
	<main>
		<ChatMenu />
		<div class="chat"></div>
	</main>
</template>

<style lang="scss">
.chat {
	display: flex;
	background-color: var(--fg-primary);
	flex-grow: 1;
}

.chat-menu,
.chat {
	height: 100%;
}

@media screen and (min-width: 800px) {
	.mobile-menu {
		display: block;

		&__toggle {
			display: none;
		}
	}
	.chat-menu {
		display: flex;
		flex-basis: 15em;
	}
}
</style>
