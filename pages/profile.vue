<script setup lang="ts">
const auth = useAuth();
const { data: profile, pending } = await useLazyFetch("/api/profile");

onMounted(() => {
	watch(auth, (newAuth) => {
		if (!newAuth.authenticated) return navigateTo("/login");
	});
});
</script>

<template>
	<main>
		<div v-if="pending">Loading...</div>
		<pre v-else-if="profile && Array.isArray(profile)"
			>{{ profile.map((p) => ({ id: p.id, username: p.username })) }}
		</pre
		>
	</main>
</template>

<style lang="scss"></style>
