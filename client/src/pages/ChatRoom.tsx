import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { importKey } from "@/lib/crypto";
import { useMessages, useCreateMessage } from "@/hooks/use-secure-chat";
import { MessageList } from "@/components/MessageList";
import { ShareLink } from "@/components/ShareLink";
import { Send, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatRoom() {
  const { code } = useParams();
  const [location, setLocation] = useLocation();
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [input, setInput] = useState("");
  
  // Generate a random sender ID for this session
  const senderId = useMemo(() => crypto.randomUUID(), []);

  // Parse key from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1); // remove '#'
    if (!hash) {
      // No key provided - security risk! Redirect home.
      setLocation("/");
      return;
    }

    importKey(hash)
      .then(setKey)
      .catch((err) => {
        console.error("Invalid key:", err);
        setLocation("/");
      });
  }, [setLocation]);

  const { data: messages = [], isLoading } = useMessages(code || "", key);
  const sendMessage = useCreateMessage(code || "", key, senderId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !key) return;

    const content = input;
    setInput(""); // Optimistic clear
    
    try {
      await sendMessage.mutateAsync(content);
    } catch (error) {
      console.error("Failed to send:", error);
      // Restore input on failure would be nice here
    }
  };

  if (!code || !key) return null;

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
          
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              Secure Room
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </h2>
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {code.slice(0, 8)}...
            </div>
          </div>
        </div>
      </header>

      {/* Share Link Banner - Only show if few messages to encourage sharing */}
      {messages.length < 2 && (
        <div className="pt-6">
          <ShareLink />
        </div>
      )}

      {/* Messages Area */}
      <MessageList 
        messages={messages} 
        currentUserId={senderId} 
        isLoading={isLoading} 
      />

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
            />
            
            <button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
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
