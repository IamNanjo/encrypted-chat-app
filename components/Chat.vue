<script setup lang="ts">
const auth = useAuth();
const selectedChat = useChat();
const keyPair = useKeyPair();
const socket = useSocket();

const newMessage = ref("");
const messages = ref<Message[]>([]);

const maxNewMessageLines = ref(6);
const newMessageLines = computed(() => newMessage.value.split("\n").length);

const sortedMessages = computed(() =>
  messages.value.sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  )
);

const { execute: getMessages } = useLazyAsyncData(
  "messages",
  async () => {
    if (
      !auth.value.authenticated ||
      !auth.value.currentDevice ||
      !selectedChat.value
    ) {
      return navigateTo("/login");
    }

    const data = await $fetch("/api/messages", {
      query: {
        chatId: selectedChat.value.id,
        deviceId: auth.value.currentDevice,
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

watch(selectedChat, (newChat) => {
  if (newChat && newChat.id && keyPair.value) getMessages();
  if (!newChat) messages.value = [];
});

watch(messages, () => scrollToBottom("chat__messages"));

function scrollToBottom(id: string) {
  const scrollContainer = document.getElementById(id);
  if (!scrollContainer) return;

  setTimeout(() => {
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
  }, 0);
}

async function sendMessage() {
  const removeChars = (string: string, chars: string[]) =>
    chars.reduce((prev, cur) => prev.replaceAll(cur, ""), string);

  // Remove whitespace (including zero width spaces)
  const trimmedMessage = removeChars(newMessage.value.trim(), [
    "\u200B",
    "\u200C",
    "\u200D",
    "\uFEFF",
  ]);

  if (!selectedChat.value || !trimmedMessage) return;

  const encoder = new TextEncoder();
  const messageId = crypto.randomUUID();

  // Encrypt message using each device of each chat member and send it
  for (let i = 0, iLen = selectedChat.value.members.length; i < iLen; i++) {
    const member = selectedChat.value.members[i];

    for (let j = 0, jLen = member.devices.length; j < jLen; j++) {
      const device = member.devices[j];

      const encryptedMessage = await encryptMessage(
        device.key,
        encoder.encode(trimmedMessage).buffer as ArrayBuffer
      );

      await $fetch("/api/messages", {
        method: "POST",
        body: {
          chatId: selectedChat.value.id,
          deviceId: device.id,
          messageId: messageId,
          message: encryptedMessage,
        },
      });
    }
  }

  newMessage.value = "";
}

async function deleteMessage(messageId: string) {
  if (!selectedChat.value) return;

  await $fetch("/api/messages", {
    method: "DELETE",
    body: {
      chatId: selectedChat.value.id,
      messageId,
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
    reloadNuxtApp();
    return null;
  }

  encryptedContent = atob(encryptedContent);

  const encryptedUint8Array = new Uint8Array(encryptedContent.length);

  for (let i = 0, len = encryptedContent.length; i < len; i++) {
    encryptedUint8Array[i] = encryptedContent.charCodeAt(i);
  }

  const cipherTextBuffer = encryptedUint8Array.buffer as ArrayBuffer;

  return crypto.subtle
    .decrypt({ name: "RSA-OAEP" }, keyPair.value.privateKey, cipherTextBuffer)
    .catch(() => {
      console.error("Decryption failed");
      return null;
    });
}

onMounted(() => {
  const onMessage = async (e: MessageEvent) => {
    const message: SocketMessage<Message> = JSON.parse(e.data);

    if (message.event !== "message" || !auth.value.authenticated) return;

    switch (message.mode) {
      case "post":
        if (
          !auth.value.currentDevice ||
          !selectedChat.value ||
          selectedChat.value.id !== message.data.chatId ||
          message.data.deviceId !== auth.value.currentDevice ||
          messages.value.map((m) => m.id).includes(message.data.id)
        )
          break;

        const decoder = new TextDecoder();
        const decryptedMessage = await decryptMessage(message.data.content);
        message.data.content = decryptedMessage
          ? decoder.decode(decryptedMessage)
          : message.data.content;
        messages.value = [...messages.value, message.data];

        break;

      case "delete":
        if (!auth.value.currentDevice || !selectedChat.value) break;

        const messageIndex = messages.value.findIndex(
          (v) => v.messageId === message.data.messageId
        );

        if (messageIndex === -1) break;

        messages.value.splice(messageIndex, 1);

        break;
    }
  };

  if (socket.value) socket.value.addEventListener("message", onMessage);
});
</script>

<template>
  <div class="chat">
    <div id="chat__messages" class="chat__messages">
      <TransitionGroup name="chat__messages-transition">
        <div
          v-for="(message, index) in sortedMessages"
          :key="message.id"
          class="chat__message"
          :style="{ transitionDelay: `${index * 20}ms` }"
        >
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
              @click="() => deleteMessage(message.messageId)"
            />
          </div>
          <div class="chat__message-content">
            <div v-for="line in message.content.split('\n')">
              {{ line }}
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
    <form class="chat__new-message" @submit.prevent="sendMessage" method="post">
      <textarea
        required
        :disabled="!selectedChat || !selectedChat.id"
        id="chat__textfield"
        class="chat__textfield"
        placeholder="Enter message here..."
        cols="30"
        :rows="
          newMessageLines < maxNewMessageLines
            ? newMessageLines
            : maxNewMessageLines
        "
        v-model="newMessage"
        @keydown.enter="
          (e) => {
            if (e.shiftKey) {
              e.preventDefault();
              sendMessage();
            } else {
              scrollToBottom('chat__textfield');
              scrollToBottom('chat__messages');
            }
          }
        "
      ></textarea>
      <button
        :disabled="!selectedChat || !selectedChat.id"
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
  flex: 1 1 100%;
  align-self: stretch;
  display: flex;
  min-width: 0;
  max-height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding-inline: 1em;
  padding-bottom: 1em;
  transition: flex 0.3s ease, padding 0.3s ease;

  --border-radius: 6px;

  &__messages {
    display: flex;
    flex-direction: column;
    gap: 1em;
    width: 100%;
    height: 100%;
    padding-right: 0.5em;
    padding-block: 1rem;
    overflow-x: hidden;
    text-overflow: ellipsis;
    overflow-y: scroll;

    &-transition-enter-active,
    &-transition-leave-active {
      transition: all 0.3s ease;
    }
    &-transition-enter-from,
    &-transition-leave-to {
      opacity: 0;
      transform: translateX(10rem);
    }
  }

  &__message {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background-color: var(--bg-raise);
    padding: 1em 1.25em;
    border: 1px solid var(--text-muted);
    border-radius: var(--border-radius);

    &-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      color: var(--text-muted);
      width: 100%;
      overflow: hidden;
      user-select: none;
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
    font-size: 1.25em;
  }

  &__textfield {
    background-color: var(--bg-raise);
    flex: 1;
    height: 100%;
    padding: 0.5em;
    border: 1px solid #7f7f7f;
    border-top-left-radius: var(--border-radius);
    border-bottom-left-radius: var(--border-radius);
    resize: none;
    overflow-y: auto;
  }

  &__send-message {
    background-color: var(--fg-primary);
    height: 100%;
    padding-inline: 0.25em;
    border: 1px solid #7f7f7f;
    border-top-right-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);

    .icon {
      color: var(--text-alt);
      filter: none;
    }
  }

  &__menu.open + .chat {
    padding: 0;
  }
}
</style>
