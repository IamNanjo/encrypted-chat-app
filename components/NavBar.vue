<script setup lang="ts">
const route = useRoute();
const theme = useColorMode();
const auth = useAuth();
const socket = useSocket();
const { remove: removeSession } = await useSession({
	fetchSessionOnInitialization: false
});

async function logOut() {
	if (socket.value) {
		// Close socket
		socket.value.send(
			JSON.stringify({ event: "auth", mode: "delete" } as SocketMessage<any>)
		);
	}

	await removeSession();
	auth.value = {
		authenticated: false,
		userId: "",
		username: "",
		currentDevice: null
	};
	return await navigateTo("/login");
}
</script>

<template>
	<nav>
		<div>
			<ChatMenuToggle v-if="route.path === '/'" tabindex="0" />
			<NuxtLink
				v-else-if="auth.authenticated"
				to="/"
				tabindex="0"
				title="Back to app"
				><Icon name="material-symbols:arrow-back-rounded" size="2em"
			/></NuxtLink>
		</div>
		<DropdownMenu>
			<div class="profile-menu__toggle" tabindex="0" title="Account">
				<Icon name="material-symbols:account-circle" size="2em" />
			</div>
			<div class="profile-menu__options">
				<div v-if="auth.authenticated" class="no-select">
					Logged in as {{ auth.username }}
				</div>
				<div>
					<Icon name="material-symbols:brightness-4-rounded" size="1.5em" />
					<select v-model="theme.preference" title="Theme selection">
						<option value="system">System</option>
						<option value="dark">Dark</option>
						<option value="light">Light</option>
					</select>
				</div>
				<NuxtLink to="/login" v-if="!auth.authenticated">
					<Icon name="material-symbols:login-rounded" size="1.5em" />
					<div>Log In</div>
				</NuxtLink>
				<NuxtLink to="/register" v-if="!auth.authenticated">
					<Icon name="material-symbols:person-add-rounded" size="1.5em" />
					<div>Sign Up</div>
				</NuxtLink>
				<NuxtLink to="/profile" v-if="auth.authenticated">
					<Icon name="material-symbols:manage-accounts-rounded" size="1.5em" />
					<div>Profile</div>
				</NuxtLink>
				<div
					v-if="auth.authenticated"
					class="clickable"
					@click.prevent="logOut"
					tabindex="0"
				>
					<Icon name="material-symbols:logout-rounded" size="1.5em" />
					<div>Log out</div>
				</div>
			</div>
		</DropdownMenu>
	</nav>
</template>

<style lang="scss">
nav {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 3em;
	padding-inline: 1em;
	border-bottom: 1px solid var(--bg-raise);
}
</style>
