<script setup lang="ts">
const auth = useAuth();
const router = useRouter();
const username = ref("");
const password = ref("");
const error = ref("");

onMounted(() => {
	if (auth.value.authenticated) router.back();
});

async function handleSubmit() {
	error.value = "";

	if (!username || !password) {
		error.value = "You need to fill all the fields";
		return;
	}

	await useFetch("/api/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: {
			username: username.value,
			password: password.value
		},
		redirect: "follow",
		async onRequestError({ response }) {
			error.value = (await response?.text()) || "Request failed";
		},
		async onResponse({ response }) {
			if (response.redirected) {
				console.log(`Redirecting to ${response.url}`);
				return await navigateTo(response.url, { external: true });
			}
			error.value = (await response.text()) || response.statusText;
		},
		async onResponseError({ response }) {
			error.value = (await response.text()) || response.statusText;
		}
	});
}
</script>

<template>
	<main>
		<form class="auth-form" @submit.prevent="handleSubmit">
			<h1>Log In</h1>
			<div class="form-group">
				<label for="username">Username</label>
				<input required id="username" type="text" v-model="username" />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input required id="password" type="text" v-model="password" />
			</div>
			<button type="submit">Log In</button>
			<Alert v-if="error">{{ error }}</Alert>
		</form>
	</main>
</template>

<style scoped lang="scss">
.auth-form {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	gap: 2em;
	background-color: rgba(255, 255, 255, 0.03);
	max-width: 450px;
	padding: 1em;
	border-radius: 12px;
	font-size: 1.125em;

	> h1 {
		font-size: 2em;
		text-align: center;
	}

	button[type="submit"] {
		background-color: var(--fg-primary);
		color: white;
		padding: 0.75em;
		border: 0;
		border-radius: 6px;
	}
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5em;

	input {
		background-color: var(--bg-raise-1);
		padding: 0.5em;
		border: 0;
		border-radius: 6px;
		box-shadow: 1px 1px 4px 1px black;
	}
}
</style>
