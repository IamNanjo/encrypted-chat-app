<script setup lang="ts">
const { session } = await useSession();
const auth = useAuth();

onMounted(() => {
	// Check session status on page load and update auth state
	watch(session, (newSession) => {
		if (newSession !== null) {
			auth.value = {
				authenticated: "username" in newSession,
				username: newSession.username || ""
			};
		}
	});

	watch(auth, (newAuth) => {
		if (!newAuth.authenticated) return navigateTo("/login");
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
	background-color: var(--bg-primary);
	flex-basis: 80%;
}

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
	height: 100%;
}

.chat {
	flex-basis: 100%;
}

.chat-menu.open + .chat {
	flex-basis: 0;
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
	}

	.chat-menu,
	.chat-menu.open {
		flex-basis: 16em;

		& + .chat {
			flex-basis: 100%;
		}
	}
}
</style>
