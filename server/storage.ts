import { db } from "./db";
import {
  rooms,
  messages,
  type InsertRoom,
  type InsertMessage,
  type Room,
  type Message,
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  createRoom(): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getMessages(roomId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async createRoom(): Promise<Room> {
    const code = nanoid(10); // Simple unique code
    const [room] = await db.insert(rooms).values({ code }).returning();
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async getMessages(roomId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
