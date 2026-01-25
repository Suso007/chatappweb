import { useState } from "react";
import { Copy, Check, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ShareLink() {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              Invite peer securely
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              This link contains the encryption key. Share it privately.
            </p>
          </div>
          
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-lg transition-colors border border-white/5"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-2 text-emerald-500"
                >
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Secure Link</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
