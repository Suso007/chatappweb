import { useUser, useGoogleLogin, usePhoneLogin, useLogout, useInitializeKeys } from "@/hooks/use-auth";
import { useSearchUsers } from "@/hooks/use-users";
import { useConversations, useCreateConversation } from "@/hooks/use-secure-chat";
import { Shield, Smartphone, Zap, Lock, Search, LogOut, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { data: user, isLoading: userLoading } = useUser();
  const { initialize, keys } = useInitializeKeys();
  const { login: googleLogin } = useGoogleLogin();
  const { sendOtp, verifyOtp } = usePhoneLogin();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  // Phone login state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [] } = useSearchUsers(searchQuery);

  // Conversations
  const { data: conversations = [] } = useConversations();
  const createConversation = useCreateConversation();

  // Initialize encryption keys when user logs in
  useEffect(() => {
    if (user) {
      initialize(user);
    }
  }, [user]);

  const handleSendOtp = async () => {
    await sendOtp.mutateAsync(phone);
    setOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    await verifyOtp.mutateAsync({ phone, code: otp });
  };

  const handleStartChat = async (userId: string) => {
    const conv = await createConversation.mutateAsync(userId);
    setLocation(`/chat/${conv.id}`);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in - show login page
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] pointer-events-none" />

        <nav className="p-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-violet-600 rounded-lg flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <span>SecureChat</span>
          </div>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome to SecureChat</h1>
              <p className="text-muted-foreground">End-to-end encrypted messaging</p>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-4">
              <button
                onClick={googleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-black px-4 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {!otpSent ? (
                <div className="space-y-3">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={!phone || sendOtp.isPending}
                    className="w-full bg-primary text-white px-4 py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {sendOtp.isPending ? "Sending..." : "Send OTP via WhatsApp"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || verifyOtp.isPending}
                    className="w-full bg-primary text-white px-4 py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {verifyOtp.isPending ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Feature icon={Zap} title="Instant" desc="Real-time messaging" />
              <Feature icon={Shield} title="E2E Encrypted" desc="Zero-knowledge server" />
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Logged in - show chat list and search
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <nav className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Lock className="w-5 h-5 text-primary" />
          <span>SecureChat</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            <span>{user.name || user.email || user.phone}</span>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Search Users */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone or email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 3 && searchResults.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-3 border-b border-white/5 text-sm text-muted-foreground">
              Search Results
            </div>
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleStartChat(result.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  {result.avatarUrl ? (
                    <img src={result.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{result.name || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">{result.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-3 border-b border-white/5 text-sm text-muted-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Conversations
          </div>
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Search for users to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setLocation(`/chat/${conv.id}`)}
                className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  {conv.otherUser.avatarUrl ? (
                    <img src={conv.otherUser.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{conv.otherUser.name || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage ? (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Encrypted message
                      </span>
                    ) : (
                      "No messages yet"
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-secondary/30">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
