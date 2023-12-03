<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
	<Transition>
		<div v-if="text.length" class="alert">{{ text }}</div>
	</Transition>
</template>

<style lang="scss">
.v-enter-active,
.v-leave-active {
	transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
	opacity: 0;
}

.alert {
	background-color: hsl(3, 100%, 60%);
	padding: 1em;
	border-radius: 12px;
	text-align: center;
	box-shadow: 1px 1px 4px 1px black;
	text-shadow: 2px 2px 4px black;
}
</style>
