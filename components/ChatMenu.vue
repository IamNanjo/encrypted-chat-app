<script setup lang="ts">
const isOpen = useChatMenu();
</script>

<template>
	<aside :class="isOpen ? 'chat-menu open' : 'chat-menu'">
		<div></div>
	</aside>
</template>

<style lang="scss">
.chat-menu {
	display: none;
	background-color: #ef5350;
	transition: all 0.3s ease;

	&.open {
		display: flex;
		flex-basis: 100%;
	}
}
</style>
