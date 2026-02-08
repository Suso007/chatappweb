import type { Express } from "express";
import type { Server } from "http";
import * as storage from "./storage";
import { requireAuth } from "./auth-routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============================================
  // User Search Routes
  // ============================================

  // Search users by phone or email
  app.get("/api/users/search", requireAuth, async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 3) {
      return res.status(400).json({ message: "Search query must be at least 3 characters" });
    }

    const users = await storage.searchUsers(query);

    // Filter out current user and return safe user data
    const results = users
      .filter((u: { id: string;[key: string]: unknown }) => u.id !== req.user!.id)
      .map((u: { id: string; name: string | null; email: string | null; avatarUrl: string | null; publicKey: string | null }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        publicKey: u.publicKey,
      }));

    res.json(results);
  });

  // Get user by ID (for fetching public key)
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.params.id as string);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      publicKey: user.publicKey,
    });
  });

  // ============================================
  // Conversation Routes
  // ============================================

  // Get all conversations for current user
  app.get("/api/conversations", requireAuth, async (req, res) => {
    const conversations = await storage.getUserConversations(req.user!.id);

    // Transform to include the "other" user in each conversation
    const result = conversations.map((conv) => {
      const otherUser = conv.user1.id === req.user!.id ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatarUrl: otherUser.avatarUrl,
          publicKey: otherUser.publicKey,
        },
        lastMessage: lastMessage
          ? {
            id: lastMessage.id,
            content: lastMessage.content, // Still encrypted
            iv: lastMessage.iv,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
          : null,
        updatedAt: conv.updatedAt,
      };
    });

    res.json(result);
  });

  // Create or get conversation with another user
  app.post("/api/conversations", requireAuth, async (req, res) => {
    const schema = z.object({ userId: z.string() });

    try {
      const { userId } = schema.parse(req.body);

      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot create conversation with yourself" });
      }

      const otherUser = await storage.getUserById(userId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const conversation = await storage.createOrGetConversation(req.user!.id, userId);

      res.status(201).json({
        id: conversation.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatarUrl: otherUser.avatarUrl,
          publicKey: otherUser.publicKey,
        },
        createdAt: conversation.createdAt,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      throw err;
    }
  });

  // Get conversation by ID
  app.get("/api/conversations/:id", requireAuth, async (req, res) => {
    const conversation = await storage.getConversation(req.params.id as string);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is part of conversation
    if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get the other user's details
    const otherUserId =
      conversation.user1Id === req.user!.id ? conversation.user2Id : conversation.user1Id;
    const otherUser = await storage.getUserById(otherUserId);

    res.json({
      id: conversation.id,
      otherUser: otherUser
        ? {
          id: otherUser.id,
          name: otherUser.name,
          avatarUrl: otherUser.avatarUrl,
          publicKey: otherUser.publicKey,
        }
        : null,
      createdAt: conversation.createdAt,
    });
  });

  // ============================================
  // Message Routes
  // ============================================

  // Get messages in a conversation
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    const conversation = await storage.getConversation(req.params.id as string);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is part of conversation
    if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const messages = await storage.getMessages(req.params.id as string, cursor, limit);

    res.json(messages);
  });

  // Send a message (encrypted content from client)
  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    const schema = z.object({
      content: z.string(), // Encrypted ciphertext
      iv: z.string(), // IV for decryption
    });

    try {
      const conversation = await storage.getConversation(req.params.id as string);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if user is part of conversation
      if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { content, iv } = schema.parse(req.body);

      const message = await storage.createMessage({
        conversationId: req.params.id as string,
        senderId: req.user!.id,
        content,
        iv,
      });

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message format" });
      }
      throw err;
    }
  });

  return httpServer;
}
