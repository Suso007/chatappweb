import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertMessage } from "@shared/routes";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { useState, useEffect } from "react";

// Hook to manage chat messages with automatic decryption
export function useMessages(roomCode: string, key: CryptoKey | null) {
  const query = useQuery({
    queryKey: [api.messages.list.path, roomCode],
    queryFn: async () => {
      const url = api.messages.list.path.replace(":code", roomCode);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    // Poll every 2 seconds for new messages
    refetchInterval: 2000,
    enabled: !!roomCode,
  });

  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);

  useEffect(() => {
    async function processMessages() {
      if (!query.data || !key) return;

      const processed = await Promise.all(
        query.data.map(async (msg) => {
          try {
            const content = await decryptMessage(msg.content, msg.iv, key);
            return { ...msg, content, isDecrypted: true };
          } catch (e) {
            return { ...msg, content: "Message could not be decrypted", isDecrypted: false };
          }
        })
      );
      setDecryptedMessages(processed);
    }
    processMessages();
  }, [query.data, key]);

  return { ...query, data: decryptedMessages };
}

export function useCreateMessage(roomCode: string, key: CryptoKey | null, senderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!key) throw new Error("No encryption key available");

      const { ciphertext, iv } = await encryptMessage(content, key);
      const payload: InsertMessage = {
        content: ciphertext,
        iv,
        senderId,
      };

      const url = api.messages.create.path.replace(":code", roomCode);
      const res = await fetch(url, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, roomCode] });
    },
  });
}

export function useCreateRoom() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
      });
      if (!res.ok) throw new Error("Failed to create room");
      return api.rooms.create.responses[201].parse(await res.json());
    },
  });
}
