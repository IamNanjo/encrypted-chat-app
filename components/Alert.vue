<template>
	<div class="alert"><slot /></div>
</template>

<style lang="scss">
.alert {
	background-color: hsl(3, 100%, 60%);
	padding: 1em;
	border-radius: 12px;
	text-align: center;
	box-shadow: 1px 1px 4px 1px black;
	text-shadow: 2px 2px 4px black;
}
</style>
