import { CreateRoomButton } from "@/components/CreateRoomButton";
import { Shield, Smartphone, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] pointer-events-none" />
      
      {/* Navbar */}
      <nav className="p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-violet-600 rounded-lg flex items-center justify-center text-white">
            <Lock className="w-4 h-4" />
          </div>
          <span>CipherChat</span>
        </div>
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Source Code
        </a>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Private messaging. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
                  Totally secret.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                End-to-end encrypted chat that lives in your browser. No signups. No logs. The server can't read your messages.
              </p>
            </div>

            <CreateRoomButton />

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Feature 
                icon={Zap} 
                title="Instant" 
                desc="Just share a link to start chatting immediately." 
              />
              <Feature 
                icon={Smartphone} 
                title="Device-to-Device" 
                desc="Keys generated on your device, never sent to server." 
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent blur-3xl rounded-full" />
            <div className="glass-card rounded-3xl p-6 relative transform rotate-3 hover:rotate-0 transition-transform duration-500">
              {/* Mock Chat Interface */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Anonymous Room</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Encrypted
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 py-4">
                  <ChatBubble text="Hey, is this channel secure?" isMe={false} />
                  <ChatBubble text="Yes! AES-GCM encryption. The server only sees ciphertext." isMe={true} />
                  <ChatBubble text="Awesome. Sending the confidential files now." isMe={false} />
                </div>

                <div className="pt-2">
                  <div className="h-12 bg-secondary/50 rounded-xl border border-white/5 w-full flex items-center px-4 text-sm text-muted-foreground">
                    Type a secure message...
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function ChatBubble({ text, isMe }: { text: string, isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-3 text-sm
        ${isMe 
          ? 'bg-primary text-white rounded-br-none' 
          : 'bg-secondary text-secondary-foreground rounded-bl-none'}
      `}>
        {text}
      </div>
    </div>
  );
}
