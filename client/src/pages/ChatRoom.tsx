import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useMessages, useSendMessage, useConversation } from "@/hooks/use-secure-chat";
import { useUser, useInitializeKeys } from "@/hooks/use-auth";
import { useGetUser } from "@/hooks/use-users";
import { Send, Lock, ArrowLeft, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");

  // Auth & Keys
  const { data: user } = useUser();
  const { keys, initialize } = useInitializeKeys();

  // Conversation data
  const { data: conversation } = useConversation(id || "");
  const otherUserPublicKey = conversation?.otherUser?.publicKey || null;

  // Messages with decryption
  const { messages, isLoading } = useMessages(id || "", keys?.privateKey || null, otherUserPublicKey);
  const sendMessage = useSendMessage(id || "", keys?.privateKey || null, otherUserPublicKey);

  // Initialize keys when user is available
  useEffect(() => {
    if (user) {
      initialize(user);
    }
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !keys) return;

    const content = input;
    setInput("");

    try {
      await sendMessage.mutateAsync(content);
    } catch (error) {
      console.error("Failed to send:", error);
      setInput(content); // Restore on failure
    }
  };

  if (!id || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col fixed inset-0">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/")}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              {conversation?.otherUser?.avatarUrl ? (
                <img src={conversation.otherUser.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {conversation?.otherUser?.name || "Loading..."}
              </h2>
              <div className="text-xs text-emerald-500 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                End-to-end encrypted
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Send an encrypted message to start</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[75%] rounded-2xl px-4 py-3 text-sm
                ${msg.senderId === user.id
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-secondary text-secondary-foreground rounded-bl-none'}
              `}>
                {msg.isDecrypted ? (
                  msg.decryptedContent
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <Lock className="w-3 h-3" />
                    Decryption failed
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative flex items-center gap-3 bg-secondary/50 rounded-2xl p-2 border border-white/5 focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-lg"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type an encrypted message..."
              className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:outline-none placeholder:text-muted-foreground/50"
              autoFocus
              disabled={!keys}
            />

            <button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending || !keys}
              className="
                p-3 rounded-xl bg-primary text-white 
                hover:bg-primary/90 hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-primary/20
              "
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          <div className="text-center mt-3">
            <p className="text-[10px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Messages are encrypted on your device before sending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
