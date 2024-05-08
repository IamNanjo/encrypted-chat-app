import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// User
export const User = sqliteTable("User", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  created: integer("created", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export const UserRelations = relations(User, ({ many }) => ({
  devices: many(Device),
  chats: many(ChatToUser),
  sentMessages: many(Message),
}));

// Device
export const Device = sqliteTable("Device", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  created: integer("created", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  lastUsed: integer("last_used", { mode: "timestamp_ms" })
    .notNull()
    .$onUpdateFn(() => new Date()),
});
export const DeviceRelations = relations(Device, ({ one, many }) => ({
  user: one(User, { fields: [Device.userId], references: [User.id] }),
  messages: many(Message),
}));

// Chat
export const Chat = sqliteTable("Chat", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  created: integer("created", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export const ChatRelations = relations(Chat, ({ many }) => ({
  members: many(ChatToUser),
  messages: many(Message),
}));

// Message
export const Message = sqliteTable("Message", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: text("message_id").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
  chatId: integer("chat_id")
    .notNull()
    .references(() => Chat.id, { onDelete: "cascade", onUpdate: "cascade" }),
  deviceId: integer("device_id")
    .notNull()
    .references(() => Device.id, { onDelete: "cascade", onUpdate: "cascade" }),
  content: text("content").notNull(),
  created: integer("created", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export const MessageRelations = relations(Message, ({ one }) => ({
  sender: one(User, { fields: [Message.userId], references: [User.id] }),
  device: one(Device, { fields: [Message.deviceId], references: [Device.id] }),
  chat: one(Chat, { fields: [Message.chatId], references: [Chat.id] }),
}));

// ChatToUser
export const ChatToUser = sqliteTable(
  "ChatToUser",
  {
    chatId: integer("chat_id")
      .notNull()
      .references(() => Chat.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({
      name: "pk_chat_to_user",
      columns: [t.chatId, t.userId],
    }),
  })
);
export const ChatToUserRelations = relations(ChatToUser, ({ one }) => ({
  chat: one(Chat, { fields: [ChatToUser.chatId], references: [Chat.id] }),
  user: one(User, { fields: [ChatToUser.userId], references: [User.id] }),
}));
