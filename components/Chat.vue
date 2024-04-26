<script setup lang="ts">
import type { AuthenticatedUser } from "~/composables/useAuth";

const auth = useAuth();
const chat = useChat();
const keyPair = useKeyPair();
const socket = useSocket();

interface Message {
  id: number;
  content: string;
  created: string;
  chatId: number;
  deviceId: number;
  sender: {
    id: number;
    username: string;
  };
}

const newMessage = ref("");
const messages = ref<Message[]>([]);

const { execute: getMessages } = await useLazyAsyncData(
  "messages",
  async () => {
    if (!auth.value.authenticated) return [] as Message[];

    const data = await $fetch("/api/messages", {
      query: {
        chatId: chat.value?.id,
        deviceId: auth.value.currentDevice?.id,
      },
    });

    const decoder = new TextDecoder();

    for (let i = 0, len = data.length; i < len; i++) {
      const encryptedContent = data[i].content;

      const decryptedBuffer = await decryptMessage(encryptedContent);
      data[i].content = decryptedBuffer
        ? decoder.decode(decryptedBuffer)
        : data[i].content;
    }

    messages.value = (data || []) as Message[];
  },
  {
    server: false,
    immediate: false,
  }
);

watch(chat, async (newChat) => {
  if (newChat && newChat.id && keyPair.value) getMessages();
  if (!newChat) messages.value = [];
});

watch(messages, () => setTimeout(scrollToBottom, 0));

function scrollToBottom() {
  const scrollContainer = document.getElementById(
    "chat__messages"
  ) as HTMLDivElement;

  scrollContainer.scrollTo({
    top: scrollContainer.scrollHeight,
    behavior: "smooth",
  });
}

async function sendMessage() {
  if (!chat.value || !newMessage.value) return;

  if (!keyPair.value || !keyPair.value.publicKey)
    return reloadNuxtApp({ force: true });

  const encoder = new TextEncoder();

  // Encrypt message using each device of each chat member and send it
  for (let i = 0, iLen = chat.value.members.length; i < iLen; i++) {
    const member = chat.value.members[i];

    for (let j = 0, jLen = member.devices.length; j < jLen; j++) {
      const device = member.devices[j];

      const encryptedMessage = await encryptMessage(
        device.key,
        encoder.encode(newMessage.value)
      );

      await $fetch("/api/messages", {
        method: "POST",
        body: {
          chat: chat.value.id,
          message: encryptedMessage,
          deviceId: device.id,
        },
      });
    }
  }

  newMessage.value = "";
}

async function deleteMessage(message: number) {
  if (!chat.value || !message) return;

  await $fetch("/api/messages", {
    method: "DELETE",
    body: {
      chat: chat.value.id,
      message: message,
    },
  });
}

function getRelativeTime(timestamp: string): string {
  const pastTime = new Date(timestamp).getTime();

  // Time difference in different units
  const seconds = Math.floor((Date.now() - pastTime) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Return formatted string
  if (days >= 1) return `${days} ${days > 1 ? "days" : "day"} ago`;
  if (hours >= 1) return `${hours} ${hours > 1 ? "hours" : "hour"} ago`;
  if (minutes >= 1)
    return `${minutes} ${minutes > 1 ? "minutes" : "minute"} ago`;

  if (seconds < 10) return "just now";

  return `${seconds} ${seconds > 1 ? "seconds" : "second"} ago`;
}

const encryptMessage = async (key: CryptoKey, plaintext: ArrayBuffer) => {
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    plaintext
  );

  const binary = String.fromCharCode.apply(
    null,
    Array.from(new Uint8Array(encryptedBuffer))
  );

  return btoa(binary);
};

async function decryptMessage(encryptedContent: string) {
  if (!keyPair.value) {
    reloadNuxtApp({ force: true, persistState: true });
    return null;
  }

  encryptedContent = atob(encryptedContent);

  const encryptedUint8Array = new Uint8Array(encryptedContent.length);

  for (let i = 0, len = encryptedContent.length; i < len; i++) {
    encryptedUint8Array[i] = encryptedContent.charCodeAt(i);
  }

  const cipherTextBuffer = encryptedUint8Array.buffer;

  return crypto.subtle
    .decrypt({ name: "RSA-OAEP" }, keyPair.value.privateKey, cipherTextBuffer)
    .catch(() => {
      console.error("Decryption failed");
      return null;
    });
}

onMounted(() => {
  const textField = document.getElementById(
    "chat__textfield"
  ) as HTMLTextAreaElement;

  textField.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onMessage = async (e: MessageEvent) => {
    const message: SocketMessage<Message> = JSON.parse(e.data);

    if (message.event !== "message" || !auth.value.authenticated) return;

    switch (message.mode) {
      case "post":
        if (
          !auth.value.currentDevice ||
          !chat.value ||
          chat.value.id !== message.data.chatId ||
          message.data.deviceId !== auth.value.currentDevice.id
        )
          break;

        const decoder = new TextDecoder();
        const decryptedMessage = await decryptMessage(message.data.content);
        message.data.content = decryptedMessage
          ? decoder.decode(decryptedMessage)
          : message.data.content;
        messages.value = [...messages.value, message.data];
        messages.value = messages.value.sort(
          (a, b) => Number(a.created) - Number(b.created)
        );

        break;

      case "delete":
        if (
          !auth.value.currentDevice ||
          !chat.value ||
          chat.value.id !== message.data.chatId ||
          message.data.deviceId !== auth.value.currentDevice.id
        )
          break;

        messages.value = messages.value
          .filter((msg) => msg.id !== message.data.id)
          .sort(
            (a, b) => Number(new Date(a.created)) - Number(new Date(b.created))
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
  <div class="chat">
    <div id="chat__messages" class="chat__messages">
      <div v-for="message in messages" :key="message.id" class="chat__message">
        <div class="chat__message-info">
          <div>
            {{ message.sender.username || "Deleted user" }} -
            {{ getRelativeTime(message.created) }}
          </div>
          <Icon
            v-if="(auth as AuthenticatedUser).userId === message.sender.id"
            class="clickable"
            name="material-symbols:delete-rounded"
            size="1.5em"
            @click="() => deleteMessage(message.id)"
          />
        </div>
        <div class="chat__message-content">
          {{ message.content }}
        </div>
      </div>
    </div>
    <form class="chat__new-message" @submit.prevent="sendMessage">
      <textarea
        required
        :disabled="!chat || !chat.id"
        id="chat__textfield"
        class="chat__textfield"
        placeholder="Enter text here..."
        cols="30"
        rows="1"
        v-model="newMessage"
      ></textarea>
      <button
        :disabled="!chat || !chat.id"
        class="chat__send-message"
        type="submit"
        title="Send"
      >
        <Icon name="material-symbols:send-rounded" size="1.5em" />
      </button>
    </form>
  </div>
</template>

<style lang="scss">
.chat {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  background-color: var(--bg-primary);
  justify-content: space-between;
  padding: 1em;

  --border-radius: 6px;

  &__messages {
    display: flex;
    position: relative;
    flex-direction: column;
    gap: 1em;
    width: 100%;
    padding-right: 0.5em;
    padding-bottom: 1em;
    overflow-x: hidden;
    text-overflow: ellipsis;
    overflow-y: auto;
  }

  &__message {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 1em;
    border-radius: var(--border-radius);
    background-color: var(--bg-raise);

    &-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      color: var(--text-muted);
      width: max-content;
      overflow: hidden;
      user-select: none;

      .icon {
        color: var(--ff-primary);
      }
    }

    &-content {
      overflow-wrap: break-word;
      word-wrap: break-word;
      word-break: break-all;
    }
  }

  &__new-message {
    display: flex;
    width: 100%;
    height: max-content;
    font-size: 1.25em;
  }

  &__textfield {
    background-color: var(--bg-raise);
    flex: 1;
    height: max-content;
    max-height: 5em;
    padding: 0.25em;
    border-top-left-radius: var(--border-radius);
    border-bottom-left-radius: var(--border-radius);
    resize: none;
  }

  &__send-message {
    background-color: var(--fg-primary);
    padding-inline: 0.25em;
    border-top-right-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);

    .icon {
      color: white;
    }
  }

  &__menu.open + .chat {
    padding: 0;
  }
}
</style>
