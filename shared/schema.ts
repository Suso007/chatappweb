import { z } from "zod";

// ============================================
// User Schemas
// ============================================
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  publicKey: z.string().nullable(),
});

export const userSearchResultSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  publicKey: z.string().nullable(),
});

// ============================================
// Conversation Schemas
// ============================================
export const conversationSchema = z.object({
  id: z.string(),
  otherUser: userSearchResultSchema,
  lastMessage: z.object({
    id: z.string(),
    content: z.string(),
    iv: z.string(),
    senderId: z.string(),
    createdAt: z.string().or(z.date()),
  }).nullable(),
  updatedAt: z.string().or(z.date()),
});

export const newConversationSchema = z.object({
  id: z.string(),
  otherUser: userSearchResultSchema,
  createdAt: z.string().or(z.date()),
});

// ============================================
// Message Schemas
// ============================================
export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(), // Encrypted
  iv: z.string(),
  createdAt: z.string().or(z.date()),
});

export const sendMessageSchema = z.object({
  content: z.string(), // Encrypted ciphertext
  iv: z.string(),
});

// ============================================
// Auth Schemas
// ============================================
export const phoneOtpRequestSchema = z.object({
  phone: z.string().min(10).max(15),
});

export const phoneOtpVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  publicKey: z.string().optional(),
});

// ============================================
// Inferred Types
// ============================================
export type User = z.infer<typeof userSchema>;
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type NewConversation = z.infer<typeof newConversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
