<script setup lang="ts"></script>

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
	border: 1px solid currentColor;
}

@media screen and (min-width: 800px) {
	.mobile-menu {
		display: block;
	}
	.chat-menu {
		display: flex;
		flex-basis: 15em !important;
	}
}
</style>
