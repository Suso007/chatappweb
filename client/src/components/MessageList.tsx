import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ShieldAlert, User, CheckCheck } from "lucide-react";
import type { Message } from "@shared/schema";

type DecryptedMessage = Message & { isDecrypted?: boolean; content: string };

interface MessageListProps {
  messages: DecryptedMessage[];
  currentUserId: string;
  isLoading: boolean;
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground text-sm animate-pulse">Decrypting history...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-60">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-medium text-foreground">No messages yet</h3>
        <p className="text-muted-foreground max-w-xs">
          This room is empty. Share the link with a friend to start chatting securely.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 sm:p-6 custom-scrollbar">
      <div className="text-center py-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
          <ShieldAlert className="w-3 h-3" />
          End-to-End Encrypted
        </span>
      </div>
      
      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  relative max-w-[85%] sm:max-w-[70%] px-5 py-3 rounded-2xl shadow-sm
                  ${
                    isMe
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-secondary text-secondary-foreground rounded-bl-none border border-white/5"
                  }
                `}
              >
                {!msg.isDecrypted && (
                  <div className="flex items-center gap-2 text-yellow-300 text-xs font-bold mb-1 uppercase tracking-wider">
                    <ShieldAlert className="w-3 h-3" /> Decryption Error
                  </div>
                )}
                
                <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                  {msg.content}
                </p>
                
                <div 
                  className={`
                    mt-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium opacity-60
                    ${isMe ? "justify-end text-white/80" : "justify-start text-muted-foreground"}
                  `}
                >
                  <span>
                    {msg.createdAt && format(new Date(msg.createdAt), "h:mm a")}
                  </span>
                  {isMe && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
