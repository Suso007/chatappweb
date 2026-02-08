import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage
} from "@/lib/crypto";
import { useState, useEffect, useCallback } from "react";

// Types
interface OtherUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  publicKey: string | null;
}

interface LastMessage {
  id: string;
  content: string;
  iv: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  iv: string;
  createdAt: string;
}

// ============================================
// useConversations - List all conversations
// ============================================
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json() as Promise<Conversation[]>;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// useConversation - Get single conversation
// ============================================
export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ["conversations", conversationId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.conversations.get.path, { id: conversationId }));
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!conversationId,
  });
}

// ============================================
// useCreateConversation - Start chat with user
// ============================================
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(api.conversations.create.path, {
        method: api.conversations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ============================================
// useMessages - Get messages with decryption
// ============================================
export function useMessages(
  conversationId: string,
  myPrivateKey: CryptoKey | null,
  otherUserPublicKeyBase64: string | null
) {
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.messages.list.path, { id: conversationId }));
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<Message[]>;
    },
    enabled: !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const [decryptedMessages, setDecryptedMessages] = useState<
    (Message & { decryptedContent?: string; isDecrypted: boolean })[]
  >([]);

  useEffect(() => {
    async function processMessages() {
      if (!query.data || !myPrivateKey || !otherUserPublicKeyBase64) {
        setDecryptedMessages([]);
        return;
      }

      try {
        const theirPublicKey = await importPublicKey(otherUserPublicKeyBase64);
        const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);

        const processed = await Promise.all(
          query.data.map(async (msg) => {
            try {
              const decryptedContent = await decryptMessage(msg.content, msg.iv, sharedKey);
              return { ...msg, decryptedContent, isDecrypted: true };
            } catch (e) {
              return { ...msg, decryptedContent: "[Decryption failed]", isDecrypted: false };
            }
          })
        );
        setDecryptedMessages(processed);
      } catch (e) {
        console.error("Failed to process messages:", e);
      }
    }

    processMessages();
  }, [query.data, myPrivateKey, otherUserPublicKeyBase64]);

  return {
    ...query,
    messages: decryptedMessages,
  };
}

// ============================================
// useSendMessage - Send encrypted message
// ============================================
export function useSendMessage(
  conversationId: string,
  myPrivateKey: CryptoKey | null,
  otherUserPublicKeyBase64: string | null
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plaintext: string) => {
      if (!myPrivateKey || !otherUserPublicKeyBase64) {
        throw new Error("Encryption keys not ready");
      }

      // Derive shared key
      const theirPublicKey = await importPublicKey(otherUserPublicKeyBase64);
      const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);

      // Encrypt message
      const { ciphertext, iv } = await encryptMessage(plaintext, sharedKey);

      // Send to server
      const res = await fetch(buildUrl(api.messages.create.path, { id: conversationId }), {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: ciphertext, iv }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
