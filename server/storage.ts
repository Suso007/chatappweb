import { prisma } from "./db";

// Use inferred types from Prisma Client
type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;
type Conversation = Awaited<ReturnType<typeof prisma.conversation.findUnique>>;
type Message = Awaited<ReturnType<typeof prisma.message.findUnique>>;
type Otp = Awaited<ReturnType<typeof prisma.otp.findUnique>>;

// ============================================
// User Operations
// ============================================

export async function createUser(data: {
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
  publicKey?: string;
}) {
  return prisma.user.create({ data });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserByPhone(phone: string) {
  return prisma.user.findUnique({ where: { phone } });
}

export async function getUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId } });
}

export async function updateUser(
  id: string,
  data: { name?: string; avatarUrl?: string; publicKey?: string; isActive?: boolean }
) {
  return prisma.user.update({ where: { id }, data });
}

export async function searchUsers(query: string) {
  return prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
  });
}

// ============================================
// Conversation Operations
// ============================================

export async function createOrGetConversation(user1Id: string, user2Id: string) {
  // Ensure consistent ordering to avoid duplicate conversations
  const [firstId, secondId] = [user1Id, user2Id].sort();

  const existing = await prisma.conversation.findUnique({
    where: {
      user1Id_user2Id: { user1Id: firstId, user2Id: secondId },
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: { user1Id: firstId, user2Id: secondId },
  });
}

export async function getConversation(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function getUserConversations(userId: string) {
  return prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, name: true, email: true, avatarUrl: true, publicKey: true } },
      user2: { select: { id: true, name: true, email: true, avatarUrl: true, publicKey: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// ============================================
// Message Operations
// ============================================

export async function createMessage(data: {
  conversationId: string;
  senderId: string;
  content: string;
  iv: string;
}) {
  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: data.conversationId },
    data: { updatedAt: new Date() },
  });

  return prisma.message.create({ data });
}

export async function getMessages(conversationId: string, cursor?: string, limit = 50) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });
}

// ============================================
// OTP Operations
// ============================================

export async function createOtp(phone: string, code: string, expiresInMinutes = 5) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Delete any existing OTPs for this phone
  await prisma.otp.deleteMany({ where: { phone } });

  return prisma.otp.create({
    data: { phone, code, expiresAt },
  });
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: {
      phone,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return true;
}

// Clean up expired OTPs (call periodically)
export async function cleanupExpiredOtps(): Promise<void> {
  await prisma.otp.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
