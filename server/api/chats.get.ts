import db, { Chat, ChatToUser, User, Device, eq, desc } from "~/server/db";
import { alias } from "drizzle-orm/sqlite-core";
import { getSession } from "~/server/session";

export interface RawChat {
  id: number;
  members: {
    id: number;
    username: string;
    devices: { id: number; key: string }[];
  }[];
}

interface TempChats {
  [id: number]: {
    id: number;
    members: {
      [userId: number]: {
        id: number;
        username: string;
        devices: {
          [deviceId: number]: {
            id: number;
            key: string;
          };
        };
      };
    };
  };
}

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const ctu1 = alias(ChatToUser, "ctu1");
  const ctu2 = alias(ChatToUser, "ctu2");

  const chatRows = db
    .select({
      id: Chat.id,
      member: {
        id: User.id,
        username: User.username,
        deviceId: Device.id,
        deviceKey: Device.key,
      },
    })
    .from(Chat)
    .innerJoin(ctu1, eq(Chat.id, ctu1.chatId))
    .innerJoin(User, eq(ctu1.userId, User.id))
    .innerJoin(Device, eq(User.id, Device.userId))
    .innerJoin(ctu2, eq(Chat.id, ctu2.chatId))
    .where(eq(ctu2.userId, User.id))
    .orderBy(desc(Chat.created))
    .all();

  if (!chatRows.length) return [];

  const tempChats: TempChats = {};

  for (let i = 0, len = chatRows.length; i < len; i++) {
    const row = chatRows[i];

    if (!row.id) continue;

    if (!(row.id in tempChats)) {
      tempChats[row.id] = {
        id: row.id,
        members: {},
      };
    }

    if (!row.member.id || !row.member.username) continue;

    if (!(row.member.id in tempChats[row.id].members)) {
      tempChats[row.id].members[row.member.id] = {
        id: row.member.id,
        username: row.member.username,
        devices: {},
      };
    }

    if (!row.member.deviceId || !row.member.deviceKey) continue;

    if (
      !(row.member.deviceId in tempChats[row.id].members[row.member.id].devices)
    ) {
      tempChats[row.id].members[row.member.id].devices[row.member.deviceId] = {
        id: row.member.deviceId,
        key: row.member.deviceKey,
      };
    }
  }

  const chats = Object.values(tempChats).map((chat: TempChats[0]) => {
    chat.members = Object.values(chat.members).map((member) => {
      member.devices = Object.values(member.devices);
      return member;
    });

    return chat;
  }) as RawChat[];

  return chats;
});
