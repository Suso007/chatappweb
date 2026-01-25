import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Create Room
  app.post(api.rooms.create.path, async (req, res) => {
    const room = await storage.createRoom();
    res.status(201).json(room);
  });

  // Get Room
  app.get(api.rooms.get.path, async (req, res) => {
    const room = await storage.getRoomByCode(req.params.code);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  });

  // List Messages
  app.get(api.messages.list.path, async (req, res) => {
    const room = await storage.getRoomByCode(req.params.code);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const msgs = await storage.getMessages(room.id);
    res.json(msgs);
  });

  // Create Message
  app.post(api.messages.create.path, async (req, res) => {
    const room = await storage.getRoomByCode(req.params.code);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    try {
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage({
        ...input,
        roomId: room.id,
      });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
