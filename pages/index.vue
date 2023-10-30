<script setup lang="ts">
const chatMenuOpen = useChatMenu();

function onResize() {
	const width = (window as Window).innerWidth;

	if (width >= 800) {
		chatMenuOpen.value = true;
	}
}

onMounted(() => {
	onResize();
	window.addEventListener("resize", onResize);
});
</script>

<template>
	<main>
		<ChatMenu v-if="chatMenuOpen" />
	</main>
</template>

<style lang="scss">
@media screen and (min-width: 800px) {
	.mobile-menu {
		display: block;
	}
	aside {
		display: flex;
	}
}
</style>
