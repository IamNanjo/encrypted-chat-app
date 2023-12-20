<script setup lang="ts">
const session = await useSession({ fetchSessionOnInitialization: false });
const auth = useAuth();
const { data: profile, refresh } = await useLazyFetch("/api/profile", {
	watch: [auth]
});

const currentPassword = ref("");
const newPassword = ref("");
const error = ref("");
const errorTimeout = ref(0);

async function handleSubmit() {
	$fetch("/api/profile", {
		method: "PUT",
		body: {
			username: profile.value?.username,
			currentPassword: currentPassword.value,
			newPassword: newPassword.value
		}
	})
		.then(() => {
			currentPassword.value = "";
			newPassword.value = "";
			refresh();
		})
		.catch((err) => {
			err.value = err.data;
		});
}

async function deleteUser() {
	$fetch("/api/user", { method: "DELETE" }).then(async () => {
		await session.remove();
		auth.value = {
			authenticated: false,
			userId: "",
			username: "",
			currentDevice: null
		};
		return await navigateTo("/login");
	});
}

async function deleteDevice(deviceId: string) {
	$fetch("/api/device", {
		method: "DELETE",
		body: { deviceId }
	})
		.then(() => {
			refresh();
		})
		.catch((err) => {
			err.value = err.data;
		});
}

onMounted(() => {
	watch(auth, (newAuth) => {
		if (!newAuth.authenticated) return navigateTo("/login");
	});

	watch(profile, (newProfile) => {
		if (newProfile) {
			auth.value.username = newProfile.username;
		}
	});

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
		<div>
			<div v-if="!profile">Failed to fetch profile</div>
			<form v-else class="profile-form" @submit.prevent="handleSubmit">
				<h1>Your Profile</h1>
				<div class="form-group">
					<label for="username">Username</label>
					<input
						required
						autofocus
						id="username"
						type="text"
						v-model="profile.username"
					/>
				</div>
				<div class="form-group">
					<label for="password">Current Password</label>
					<input
						id="password"
						type="password"
						autocomplete="current-password"
						v-model="currentPassword"
					/>
				</div>
				<div class="form-group">
					<label for="passwordConfirm">New Password</label>
					<input
						id="passwordConfirm"
						type="password"
						autocomplete="new-password"
						v-model="newPassword"
					/>
				</div>
				<div class="profile-form__button-container">
					<button type="submit">Save Changes</button>
					<button @click="deleteUser">Delete User</button>
				</div>
				<Alert :text="error"></Alert>
			</form>

			<div v-if="profile?.devices?.length" class="devices">
				<h2>Your Devices</h2>
				<div class="devices__table-container">
					<table class="devices__table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Last used</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr :key="device.id" v-for="device in profile?.devices">
								<td>{{ device.name }}</td>
								<td>
									{{ new Date(device.lastUsed).toLocaleString("en-GB") }}
								</td>
								<td>
									<button @click="() => deleteDevice(device.id)">
										<Icon name="material-symbols:delete-rounded" size="1.5em" />
									</button>
								</td>
							</tr>
						</tbody>
						<div></div>
					</table>
				</div>
			</div>
		</div>
	</main>
</template>

<style scoped lang="scss">
main {
	padding-block: 2em;
}
main > div {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: stretch;
	gap: 2em;
	padding: 1em;
}

.profile-form,
.devices {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	gap: 2em;
	background-color: var(--bg-raise);
	max-width: min(450px, 95%);
	padding: 1em;
	border-radius: 12px;
	font-size: 1.125em;

	> h1,
	h2 {
		font-size: 1.75em;
		text-align: center;
	}

	> a,
	> .or {
		color: var(--text-muted);
		margin-top: -1em;
		text-align: center;
		font-size: 1.25em;
	}
}

.profile-form {
	&__button-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1em;

		> * {
			margin: auto;
		}
	}

	button {
		background-color: var(--fg-primary);
		color: white;
		padding: 0.75em;
		border: 0;
		border-radius: 6px;
	}
}

.devices {
	&__table-container {
		width: 100%;
		overflow-x: auto;
	}
	&__table {
		width: 100%;
		text-align: center;
		border-collapse: collapse;

		tr:nth-child(2) {
			background-color: var(--bg-raise);
		}

		th,
		td {
			padding: 0.5em;
			vertical-align: middle;
		}
	}

	button {
		background-color: transparent;
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
