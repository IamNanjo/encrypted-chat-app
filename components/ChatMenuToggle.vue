<script setup lang="ts">
const isOpen = useChatMenu();
</script>

<template>
	<div
		:class="`mobile-menu__toggle ${isOpen ? 'open' : ''}`"
		@click="() => (isOpen = !isOpen)"
	>
		<span></span>
		<span></span>
		<span></span>
		<span></span>
	</div>
</template>

<style lang="scss">
.mobile-menu__toggle {
	width: 30px;
	height: 22px;
	position: relative;
	margin: 0;
	padding: 0;
	-webkit-transform: rotate(0deg);
	-moz-transform: rotate(0deg);
	-o-transform: rotate(0deg);
	transform: rotate(0deg);
	-webkit-transition: 0.5s ease-in-out;
	-moz-transition: 0.5s ease-in-out;
	-o-transition: 0.5s ease-in-out;
	transition: 0.5s ease-in-out;
	cursor: pointer;

	span {
		display: block;
		position: absolute;
		height: 4px;
		width: 100%;
		background: var(--text-primary);
		border-radius: 4px;
		opacity: 1;
		left: 0;
		-webkit-transform: rotate(0deg);
		-moz-transform: rotate(0deg);
		-o-transform: rotate(0deg);
		transform: rotate(0deg);
		-webkit-transition: 0.25s ease-in-out;
		-moz-transition: 0.25s ease-in-out;
		-o-transition: 0.25s ease-in-out;
		transition: 0.25s ease-in-out;
	}

	span:nth-child(1) {
		top: 0px;
	}
	span:nth-child(2),
	span:nth-child(3) {
		top: 9px;
	}
	span:nth-child(4) {
		top: 18px;
	}

	&.open span:nth-child(1) {
		top: 9px;
		width: 0%;
		left: 50%;
	}
	&.open span:nth-child(2) {
		-webkit-transform: rotate(45deg);
		-moz-transform: rotate(45deg);
		-o-transform: rotate(45deg);
		transform: rotate(45deg);
	}
	&.open span:nth-child(3) {
		-webkit-transform: rotate(-45deg);
		-moz-transform: rotate(-45deg);
		-o-transform: rotate(-45deg);
		transform: rotate(-45deg);
	}
	&.open span:nth-child(4) {
		top: 9px;
		width: 0%;
		left: 50%;
	}
}
</style>
