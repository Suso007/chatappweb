// API route definitions for client-side consumption

export const api = {
  // ============================================
  // Auth Routes
  // ============================================
  auth: {
    google: {
      method: "GET" as const,
      path: "/api/auth/google",
    },
    phoneOtp: {
      send: {
        method: "POST" as const,
        path: "/api/auth/phone/send-otp",
      },
      verify: {
        method: "POST" as const,
        path: "/api/auth/phone/verify-otp",
      },
    },
    me: {
      get: {
        method: "GET" as const,
        path: "/api/auth/me",
      },
      update: {
        method: "PATCH" as const,
        path: "/api/auth/me",
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
    },
  },

  // ============================================
  // User Routes
  // ============================================
  users: {
    search: {
      method: "GET" as const,
      path: "/api/users/search",
    },
    get: {
      method: "GET" as const,
      path: "/api/users/:id",
    },
  },

  // ============================================
  // Conversation Routes
  // ============================================
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations",
    },
    create: {
      method: "POST" as const,
      path: "/api/conversations",
    },
    get: {
      method: "GET" as const,
      path: "/api/conversations/:id",
    },
  },

  // ============================================
  // Message Routes
  // ============================================
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/conversations/:id/messages",
    },
    create: {
      method: "POST" as const,
      path: "/api/conversations/:id/messages",
    },
  },
};

// Helper to build URL with path parameters
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
