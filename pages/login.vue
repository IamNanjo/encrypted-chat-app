<script setup lang="ts">
const auth = useAuth();
const { session, refresh } = await useSession();

const username = ref("");
const password = ref("");
const error = ref("");

onMounted(() => {
	// Check session status on page load and update auth state
	watch(session, (newSession) => {
		if (newSession !== null) {
			auth.value = {
				authenticated: "username" in newSession,
				username: newSession.username || ""
			};

			if (auth.value.authenticated) return navigateTo("/");
		}
	});
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
			if (response.redirected) await refresh();
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
			<div class="or">or</div>
			<NuxtLink to="/register">Sign up instead</NuxtLink>
			<div class="form-group">
				<label for="username">Username</label>
				<input
					required
					autofocus
					id="username"
					type="text"
					autocomplete="username"
					v-model="username"
				/>
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input
					required
					id="password"
					type="password"
					autocomplete="current-password"
					v-model="password"
				/>
			</div>
			<button type="submit">Log In</button>
			<Alert v-if="error">{{ error }}</Alert>
		</form>
	</main>
</template>

<style lang="scss">
.auth-form {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	gap: 2em;
	background-color: var(--bg-raise);
	max-width: min(450px, 95%);
	padding: 1em;
	border-radius: 12px;
	font-size: 1.125em;

	> h1 {
		font-size: 2em;
		text-align: center;
	}

	> a,
	> .or {
		color: var(--text-muted);
		margin-top: -1em;
		text-align: center;
		font-size: 1.25em;
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
