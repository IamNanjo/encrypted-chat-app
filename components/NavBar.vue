<script setup lang="ts">
const route = useRoute();
const auth = useAuth();
</script>

<template>
  <nav>
    <div>
      <ClientOnly
        ><ChatMenuToggle v-if="route.path === '/'" tabindex="0" />
        <NuxtLink
          v-else-if="auth.authenticated"
          to="/"
          tabindex="0"
          title="Back to app"
          ><Icon
            name="material-symbols:arrow-back-rounded"
            size="2em" /></NuxtLink
      ></ClientOnly>
    </div>
    <DropdownMenu>
      <div class="profile-menu__toggle" tabindex="0" title="Account">
        <Icon name="material-symbols:account-circle" size="2em" />
      </div>
      <ClientOnly>
        <div class="profile-menu__options">
          <div v-if="auth.authenticated" class="no-select">
            Logged in as {{ auth.username }}
          </div>
          <NuxtLink to="/login" v-if="!auth.authenticated">
            <Icon name="material-symbols:login-rounded" size="1.5em" />
            <div>Log In</div>
          </NuxtLink>
          <NuxtLink to="/profile" v-if="auth.authenticated">
            <Icon
              name="material-symbols:manage-accounts-rounded"
              size="1.5em"
            />
            <div>Profile</div>
          </NuxtLink>
          <div
            v-if="auth.authenticated"
            class="clickable"
            @click="logOut"
            tabindex="0"
          >
            <Icon name="material-symbols:logout-rounded" size="1.5em" />
            <div>Log out</div>
          </div>
        </div>
      </ClientOnly>
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
