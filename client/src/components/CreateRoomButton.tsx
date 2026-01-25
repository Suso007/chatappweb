import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useCreateRoom } from "@/hooks/use-secure-chat";
import { generateKey, exportKey } from "@/lib/crypto";
import { motion } from "framer-motion";

export function CreateRoomButton() {
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // 1. Generate local encryption key
      const key = await generateKey();
      const keyString = await exportKey(key);

      // 2. Create room on server
      const room = await createRoom.mutateAsync();

      // 3. Redirect to chat with key in hash
      // The key NEVER leaves the client. It's passed in the URL hash fragment.
      setLocation(`/chat/${room.code}#${keyString}`);
    } catch (error) {
      console.error("Failed to setup secure chat", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreate}
        disabled={isCreating}
        className="
          group relative px-8 py-4 rounded-2xl
          bg-gradient-to-r from-primary to-violet-600
          text-white font-bold text-lg shadow-2xl shadow-primary/25
          hover:shadow-primary/40 hover:-translate-y-1
          transition-all duration-300 w-full max-w-sm overflow-hidden
        "
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="relative flex items-center justify-center gap-3">
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Establishing Secure Channel...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Start Secure Chat</span>
            </>
          )}
        </div>
      </motion.button>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground/80 bg-white/5 px-4 py-2 rounded-full border border-white/5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>End-to-end encrypted. Zero knowledge.</span>
      </div>
    </div>
  );
}
