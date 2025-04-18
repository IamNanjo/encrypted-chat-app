<script setup lang="ts">
const auth = useAuth();
const selectedChat = useChat();
const keyPair = useKeyPair();
const socket = useSocket();

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const newMessageMaxLines = 6;
const newMessageMaxLength = 382;

const isMobile = /Mobi|Android/i.test(navigator.userAgent);

const newMessage = ref("");
const messages = ref<Message[]>([]);

const removeChars = (string: string, chars: string[]) =>
    chars.reduce((prev, cur) => prev.replaceAll(cur, ""), string);

const newMessageLines = computed(() => newMessage.value.split("\n").length);

const newMessageBuffer = computed(() => {
    const trimmedMessage = removeChars(newMessage.value.trim(), [
        "\u200B",
        "\u200C",
        "\u200D",
        "\uFEFF",
    ]);

    if (!trimmedMessage) return new ArrayBuffer(0);

    return encoder.encode(trimmedMessage).buffer as ArrayBuffer;
});

const sortedMessages = computed(() =>
    messages.value.sort(
        (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
    ),
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
    },
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

function enterPressed(e: KeyboardEvent) {
    if (e.shiftKey || isMobile) {
        scrollToBottom("chat__textfield");
        scrollToBottom("chat__messages");
    } else {
        e.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    if (
        !selectedChat.value ||
        !newMessageBuffer.value.byteLength ||
        newMessageBuffer.value.byteLength > 382
    )
        return;

    const messageId = crypto.randomUUID();

    // Encrypt message using each device of each chat member and send it
    for (let i = 0, iLen = selectedChat.value.members.length; i < iLen; i++) {
        const member = selectedChat.value.members[i];

        for (let j = 0, jLen = member.devices.length; j < jLen; j++) {
            const device = member.devices[j];

            const encryptedMessage = await encryptMessage(
                device.key,
                newMessageBuffer.value,
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
        plaintext,
    );

    const binary = String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(encryptedBuffer)),
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
        .decrypt(
            { name: "RSA-OAEP" },
            keyPair.value.privateKey,
            cipherTextBuffer,
        )
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
                const decryptedMessage = await decryptMessage(
                    message.data.content,
                );
                message.data.content = decryptedMessage
                    ? decoder.decode(decryptedMessage)
                    : message.data.content;
                messages.value = [...messages.value, message.data];

                break;

            case "delete":
                if (!auth.value.currentDevice || !selectedChat.value) break;

                const messageIndex = messages.value.findIndex(
                    (v) => v.messageId === message.data.messageId,
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
                            v-if="
                                (auth as AuthenticatedUser).userId ===
                                message.sender.id
                            "
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
        <form
            class="chat__new-message"
            @submit.prevent="sendMessage"
            method="post"
        >
            <textarea
                required
                :disabled="!selectedChat || !selectedChat.id"
                id="chat__textfield"
                class="chat__textfield"
                placeholder="Enter message here..."
                cols="30"
                :rows="
                    newMessageLines < newMessageMaxLines
                        ? newMessageLines
                        : newMessageMaxLines
                "
                v-model="newMessage"
                @keydown.enter="enterPressed"
            />
            <span class="chat__new-message-character-count"
                >{{ newMessageBuffer.byteLength }} /
                {{ newMessageMaxLength }}</span
            >
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
    max-height: 100%;
    flex-direction: column;
    justify-content: space-between;
    padding-inline: 1em;
    padding-bottom: 1em;
    transition:
        flex 0.3s ease,
        padding 0.3s ease;
    overflow: hidden;

    --border-radius: 6px;

    &__messages {
        display: flex;
        flex-direction: column;
        gap: 1em;
        height: 100%;
        padding-right: 0.5em;
        padding-block: 1rem;
        text-overflow: ellipsis;
        overflow-x: hidden;
        overflow-y: scroll;

        &-transition-enter-active,
        &-transition-leave-active {
            transition: all 0.3s ease;
        }
        &-transition-enter-from,
        &-transition-leave-to {
            opacity: 0;
            transform: translateX(100%);
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
            overflow: hidden;
            user-select: none;
        }

        &-content {
            line-break: loose;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-all;
        }
    }

    &__new-message {
        display: flex;
        font-size: 1.125rem;

        &-character-count {
            bottom: 1px;
            right: 3.25rem;
            display: flex;
            align-items: center;
            background-color: var(--bg-raise);
            color: var(--text-muted);
            padding-inline: 0.5em;
            border: 1px solid var(--text-muted);
            border-left: 0;
            font-size: 0.875rem;
            text-align: right;
            text-shadow: 1px 1px 2px black;
            user-select: none;
        }
    }

    &__textfield {
        position: relative;
        background-color: var(--bg-raise);
        flex: 1;
        height: 100%;
        padding: 0.5em;
        border: 1px solid var(--text-muted);
        border-right: 0;
        border-top-left-radius: var(--border-radius);
        border-bottom-left-radius: var(--border-radius);
        resize: none;
        line-height: 1.25;
        overflow-y: auto;

        --scrollbar-size: 4px;

        &:focus {
            border: 1px solid currentColor;
            border-right: 0;
            outline: 0;

            + * {
                border-block: 1px solid var(--text-primary);
            }
        }
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
