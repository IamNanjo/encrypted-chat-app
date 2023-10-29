<script setup lang="ts">
const route = useRoute();
const theme = useColorMode();
const auth = useAuth();
</script>

<template>
	<nav>
		<div>
			<ChatMenuToggle v-if="route.path === '/'" tabindex="0" />
			<NuxtLink v-else to="/" tabindex="0"
				><Icon name="material-symbols:arrow-back-rounded" size="2em"
			/></NuxtLink>
		</div>
		<DropdownMenu>
			<div class="profile-menu__toggle" tabindex="0">
				<Icon name="material-symbols:account-circle" size="2em" />
			</div>
			<div class="profile-menu__options">
				<NuxtLink to="/login" v-if="!auth.authenticated">
					<Icon name="material-symbols:login-rounded" size="1.5em" />
					<div>Log in</div>
				</NuxtLink>
				<NuxtLink to="/register" v-if="!auth.authenticated">
					<Icon name="material-symbols:person-add-rounded" size="1.5em" />
					<div>Register</div>
				</NuxtLink>
				<NuxtLink to="/profile" v-if="auth.authenticated">
					<Icon name="material-symbols:manage-accounts-rounded" size="1.5em" />
					<div>Profile</div>
				</NuxtLink>
				<div>
					<Icon name="material-symbols:brightness-4-rounded" size="1.5em" />
					<select v-model="theme.preference">
						<option value="system">System</option>
						<option value="dark">Dark</option>
						<option value="light">Light</option>
					</select>
				</div>
				<NuxtLink to="/logout" v-if="auth.authenticated">
					<Icon name="material-symbols:logout-rounded" size="1.5em" />
					<div>Log out</div>
				</NuxtLink>
			</div>
		</DropdownMenu>
	</nav>
</template>

<style lang="scss">
nav {
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: absolute;
	top: 0;
	width: 100%;
	height: 3em;
	padding-inline: 1em;
	border-bottom: 1px solid var(--bg-raise);
}
</style>
