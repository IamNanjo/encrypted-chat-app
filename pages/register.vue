<script setup lang="ts">
const auth = useAuth();
const socket = useSocket();
const { session, refresh } = await useSession({
	fetchSessionOnInitialization: false
});

const username = ref("");
const password = ref("");
const passwordConfirm = ref("");
const error = ref("");
const errorTimeout = ref(0);

onMounted(() => {
	// Check session status on page load and update auth state
	watch(session, (newSession) => {
		if (newSession !== null) {
			auth.value = {
				authenticated: "username" in newSession,
				userId: newSession.userId || "",
				username: newSession.username || "",
				currentDevice: null
			};

			if (auth.value.authenticated) {
				if (socket.value) {
					const wsAuthenticate = (socket: WebSocket) => {
						window.setTimeout(() => {
							if (socket.readyState !== socket.OPEN)
								return wsAuthenticate(socket);

							socket.send(
								JSON.stringify({
									event: "auth",
									mode: "post",
									data: { userId: auth.value.userId, password: password.value }
								} as SocketMessage<{ userId: string; password: string }>)
							);

							return navigateTo("/");
						}, 100);
					};

					wsAuthenticate(socket.value);
				}
			}
		}
	});
});

async function handleSubmit() {
	if (!username.value || !password.value || !passwordConfirm.value) {
		return (error.value = "You need to fill all the fields");
	}

	if (password.value !== passwordConfirm.value) {
		return (error.value = "The passwords do not match");
	}

	await $fetch("/api/user", {
		method: "POST",
		body: {
			username: username.value,
			password: password.value,
			passwordConfirm: passwordConfirm.value
		}
	}).catch((err) => {
		error.value = err.data;
	});

	await refresh();
}

onMounted(() => {
	watch(error, (newError) => {
		if (newError) {
			window.clearTimeout(errorTimeout.value);
			errorTimeout.value = window.setTimeout(() => {
				error.value = "";
			}, 5000);
		}
	});
});
</script>

<template>
	<main>
		<form class="auth-form" @submit.prevent="handleSubmit">
			<h1>Sign up</h1>
			<div class="or">or</div>
			<NuxtLink to="/login">Log in instead</NuxtLink>
			<div class="form-group">
				<label for="username">Username</label>
				<input
					required
					autofocus
					id="username"
					type="text"
					v-model="username"
				/>
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input
					required
					id="password"
					type="password"
					autocomplete="new-password"
					v-model="password"
				/>
			</div>
			<div class="form-group">
				<label for="passwordConfirm">Confirm Password</label>
				<input
					required
					id="passwordConfirm"
					type="password"
					autocomplete="new-password"
					v-model="passwordConfirm"
				/>
			</div>
			<button type="submit">Create account</button>
			<Alert :text="error"></Alert>
		</form>
	</main>
</template>

<style scoped lang="scss">
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
		font-size: 1.75em;
		text-align: center;
	}

	> a,
	> .or {
		color: var(--text-muted);
		width: max-content;
		margin-inline: auto;
		margin-top: -1.25em;
		font-size: 1.25em;
		user-select: none;
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
