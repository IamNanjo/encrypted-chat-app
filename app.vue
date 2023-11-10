<script setup lang="ts">
const { session } = await useSession();
const auth = useAuth();

onMounted(() => {
	// Check session status on page load and update auth state
	watch(session, (newSession) => {
		if (newSession !== null && !auth.value.authenticated) {
			auth.value = {
				authenticated: "username" in newSession,
				username: newSession.username || ""
			};
		} else {
			return navigateTo("/login");
		}
	});
});
</script>

<template>
	<NavBar />
	<NuxtPage />
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
	transition: all 0.1s;
}

.page-enter-from,
.page-leave-to {
	opacity: 0;
	filter: blur(1rem);
}

*,
*::before,
*::after {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	font: inherit;
	text-decoration: none;
	transition-property: background-color, color;
	transition-duration: 0.2s;
	transition-timing-function: linear;
}

:root {
	color-scheme: light;
	--bg-primary: #cccccc;
	--bg-raise: rgba(0, 0, 0, 0.25);
	--bg-raise-1: var(--bg-primary);
	--fg-primary: #ff6961;
	--text-primary: black;
	--text-alt: var(--fg-primary);
	--ff-primary: Roboto, sans-serif;
	--ff-mono: "JetBrains Mono", monospace;
}
:root.dark {
	color-scheme: dark;
	--bg-primary: #121212;
	--bg-raise: rgba(255, 255, 255, 0.07);
	--bg-raise-1: #232323;
	--fg-primary: #ff6961;
	--text-primary: white;
	--text-alt: var(--fg-primary);
	--ff-primary: Roboto, sans-serif;
	--ff-mono: "JetBrains Mono", monospace;
}

:root .icon {
	color: black;
}
:root.dark .icon {
	color: white;
}

body {
	position: relative;
	background-color: var(--bg-primary);
	color: var(--text-primary);
	font-family: var(--ff-primary);
	z-index: 0;
}

pre,
code {
	font-family: var(--ff-mono);
}

main {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	height: 100svh;
	padding-top: 3em;
}

a {
	color: var(--text-primary);
	user-select: none;

	&:visited {
		color: var(--text-primary);
	}
}

button {
	text-shadow: 2px 2px 4px black;
}

.clickable,
button {
	user-select: none;
	cursor: pointer;
}

.raise {
	background-color: var(--bg-raise);
}
</style>
