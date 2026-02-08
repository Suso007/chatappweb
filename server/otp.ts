import { prisma } from "./db";
import { nanoid } from "nanoid";

/**
 * Generate a 6-digit OTP code
 */
function generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via WhatsApp
 * TODO: Implement actual WhatsApp API integration
 * For now, this is a stub that logs the OTP to console
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
    // ============================================
    // STUB: Replace with actual WhatsApp API call
    // ============================================
    console.log(`[WhatsApp OTP] To: ${phone}`);
    console.log(`[WhatsApp OTP] Message: ${message}`);

    // In production, implement your WhatsApp API here:
    // - WhatsApp Business API
    // - Twilio WhatsApp
    // - MessageBird
    // - etc.

    return true;
}

/**
 * Generate and send OTP to phone number
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; expiresAt: Date }> {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this phone
    await prisma.otp.deleteMany({ where: { phone } });

    // Create new OTP
    await prisma.otp.create({
        data: {
            phone,
            code,
            expiresAt,
        },
    });

    // Send via WhatsApp
    const message = `Your SecureChat verification code is: ${code}\n\nThis code expires in 5 minutes.`;
    const sent = await sendWhatsAppMessage(phone, message);

    return { success: sent, expiresAt };
}

/**
 * Verify OTP code
 */
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

    // Mark as verified
    await prisma.otp.update({
        where: { id: otp.id },
        data: { verified: true },
    });

    return true;
}

/**
 * Get or create user by phone number after OTP verification
 */
export async function getOrCreateUserByPhone(phone: string) {
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
        user = await prisma.user.create({
            data: { phone },
        });
    }

    return user;
}
