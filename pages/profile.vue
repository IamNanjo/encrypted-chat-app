<script setup lang="ts">
const auth = useAuth();
const socket = useSocket();

interface Device {
  id: string;
  lastUsed: string;
  name: string;
}

const { data: profile } = await useLazyFetch("/api/profile");

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
      newPassword: newPassword.value,
    },
  })
    .then((res) => {
      currentPassword.value = "";
      newPassword.value = "";

      if (typeof res === "string") return;

      // @ts-expect-error Compatible, but slightly different types
      profile.value = { ...profile.value, ...res };
      if (auth.value.authenticated) auth.value.username = res.username;
    })
    .catch((err) => {
      err.value = err.data;
    });
}

async function deleteUser() {
  $fetch("/api/user", { method: "DELETE" }).then(logOut);
}

async function deleteDevice(deviceId: number) {
  $fetch("/api/device", {
    method: "DELETE",
    body: { deviceId },
  }).catch((err) => {
    err.value = err.data;
  });
}

onMounted(() => {
  refreshNuxtData("updateDevice");

  watch(auth, (newAuth) => {
    if (!newAuth.authenticated) return navigateTo("/login");
  });

  watch(profile, (newProfile) => {
    if (newProfile && auth.value.authenticated) {
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

  const onMessage = async (e: MessageEvent) => {
    const message: SocketMessage<Device> = JSON.parse(e.data);

    if (message.event !== "device") return;

    switch (message.mode) {
      case "post":
        if (!profile.value) break;
        // @ts-expect-error Compatible but slightly different types
        profile.value.devices.push(message.data);

        break;

      case "delete":
        if (!profile.value) break;
        profile.value.devices = profile.value.devices
          // @ts-expect-error Compatible but slightly different types
          .filter((device) => device.id !== message.data.id)
          .sort(
            (a, b) =>
              new Date(a.lastUsed).getTime() + new Date(b.lastUsed).getTime()
          );

        break;
    }
  };

  if (socket.value) socket.value.addEventListener("message", onMessage);

  watch(socket, () => {
    if (socket.value) socket.value.addEventListener("message", onMessage);
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
              <tr
                :key="device.id"
                v-for="device in profile?.devices"
                :class="
                  auth.authenticated &&
                  auth.currentDevice !== null &&
                  device.id === auth.currentDevice &&
                  'current-device'
                "
              >
                <td>{{ device.name }}</td>
                <td>
                  {{ new Date(device.lastUsed).toLocaleString("en-GB") }}
                </td>
                <td>
                  <button
                    @click="() => deleteDevice(device.id)"
                    :disabled="
                      auth.authenticated &&
                      auth.currentDevice !== null &&
                      device.id === auth.currentDevice
                    "
                  >
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

  .current-device {
    font-weight: 700;
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
