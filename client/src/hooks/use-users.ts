import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

interface UserSearchResult {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    publicKey: string | null;
}

// ============================================
// useSearchUsers - Search for users by phone/email
// ============================================
export function useSearchUsers(query: string) {
    return useQuery({
        queryKey: ["users", "search", query],
        queryFn: async () => {
            if (!query || query.length < 3) return [];

            const res = await fetch(`${api.users.search.path}?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error("Failed to search users");
            return res.json() as Promise<UserSearchResult[]>;
        },
        enabled: query.length >= 3,
        staleTime: 30 * 1000, // 30 seconds
    });
}

// ============================================
// useGetUser - Get user by ID (for public key)
// ============================================
export function useGetUser(userId: string) {
    return useQuery({
        queryKey: ["users", userId],
        queryFn: async () => {
            const res = await fetch(buildUrl(api.users.get.path, { id: userId }));
            if (!res.ok) throw new Error("Failed to get user");
            return res.json() as Promise<UserSearchResult>;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
