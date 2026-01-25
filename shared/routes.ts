import { z } from "zod";
import { insertRoomSchema, insertMessageSchema, rooms, messages } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  rooms: {
    create: {
      method: "POST" as const,
      path: "/api/rooms",
      input: z.object({}), // No input needed, server generates code
      responses: {
        201: z.custom<typeof rooms.$inferSelect>(),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/rooms/:code",
      responses: {
        200: z.custom<typeof rooms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/rooms/:code/messages",
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/rooms/:code/messages",
      input: insertMessageSchema.omit({ roomId: true }), // roomId derived from code
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
