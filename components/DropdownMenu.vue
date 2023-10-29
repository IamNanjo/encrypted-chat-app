<script setup lang="ts"></script>

<template>
	<div class="profile-menu">
		<slot />
	</div>
</template>

<style lang="scss">
.profile-menu {
	position: relative;
	width: max-content;
	z-index: 10;

	&:focus > &__options,
	&:focus-within > &__options {
		display: flex;
	}

	&__toggle {
		cursor: pointer;
	}

	&__options {
		display: none;
		flex-direction: column;
		position: absolute;
		background-color: var(--bg-raise-1);
		bottom: -0.5em;
		left: 1em;
		transform: translate(-100%, 100%);
		border-radius: 6px;
		box-shadow: 1px 1px 4px 2px black;

		> * {
			display: flex;
			align-items: center;
			gap: 1em;
			width: 100%;
			height: 3em;
			padding-inline: 1em;
			cursor: pointer;

			&:not(:last-child) {
				border-bottom: 1px solid var(--bg-raise);
			}
		}

		* {
			text-wrap: nowrap;
		}
	}

	select {
		padding: 0.25em 0.5em;
		border: 0;
		border-radius: 6px;
	}
}
</style>
