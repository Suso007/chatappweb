import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { initializeKeys } from "@/lib/crypto";
import { useEffect, useState } from "react";

// Types
interface User {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    avatarUrl: string | null;
    publicKey: string | null;
}

// ============================================
// useUser - Get current authenticated user
// ============================================
export function useUser() {
    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const res = await fetch(api.auth.me.get.path);
            if (res.status === 401) {
                return null;
            }
            if (!res.ok) throw new Error("Failed to fetch user");
            return res.json() as Promise<User>;
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================
// useInitializeKeys - Set up device keys on login
// ============================================
export function useInitializeKeys() {
    const queryClient = useQueryClient();
    const [keys, setKeys] = useState<{
        privateKey: CryptoKey;
        publicKey: string;
    } | null>(null);

    const uploadPublicKey = useMutation({
        mutationFn: async (publicKey: string) => {
            const res = await fetch(api.auth.me.update.path, {
                method: api.auth.me.update.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicKey }),
            });
            if (!res.ok) throw new Error("Failed to upload public key");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });

    const initialize = async (user: User | null) => {
        if (!user) return;

        // Initialize or load keys
        const keyData = await initializeKeys();
        setKeys(keyData);

        // Upload public key if not on server yet
        if (!user.publicKey || user.publicKey !== keyData.publicKey) {
            await uploadPublicKey.mutateAsync(keyData.publicKey);
        }
    };

    return {
        keys,
        initialize,
        isLoading: uploadPublicKey.isPending,
    };
}

// ============================================
// useGoogleLogin - Redirect to Google OAuth
// ============================================
export function useGoogleLogin() {
    const login = () => {
        window.location.href = api.auth.google.path;
    };

    return { login };
}

// ============================================
// usePhoneLogin - Phone OTP authentication
// ============================================
export function usePhoneLogin() {
    const queryClient = useQueryClient();

    const sendOtp = useMutation({
        mutationFn: async (phone: string) => {
            const res = await fetch(api.auth.phoneOtp.send.path, {
                method: api.auth.phoneOtp.send.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to send OTP");
            }
            return res.json();
        },
    });

    const verifyOtp = useMutation({
        mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
            const res = await fetch(api.auth.phoneOtp.verify.path, {
                method: api.auth.phoneOtp.verify.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to verify OTP");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });

    return { sendOtp, verifyOtp };
}

// ============================================
// useLogout - Logout user
// ============================================
export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch(api.auth.logout.path, {
                method: api.auth.logout.method,
            });
            if (!res.ok) throw new Error("Failed to logout");
            return res.json();
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });
}

// ============================================
// useUpdateProfile - Update user profile
// ============================================
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name?: string; publicKey?: string }) => {
            const res = await fetch(api.auth.me.update.path, {
                method: api.auth.me.update.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
}
