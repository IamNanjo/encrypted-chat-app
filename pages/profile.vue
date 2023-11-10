<script setup lang="ts">
const auth = useAuth();
const { data: profile, pending } = await useLazyFetch("/api/user/profile");

onMounted(() => {
	watch(auth, (newAuth) => {
		if (!newAuth.authenticated) return navigateTo("/login");
	});
});
</script>

<template>
	<main>
		<div v-if="pending">Loading...</div>
		<div v-else>{{ profile }}</div>
	</main>
</template>

<style lang="scss"></style>
