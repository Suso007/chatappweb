import type { Express, Request, Response, NextFunction } from "express";
import passport from "./auth";
import { sendOtp, verifyOtp, getOrCreateUserByPhone } from "./otp";
import * as storage from "./storage";
import { z } from "zod";

// Auth middleware - protects routes that require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
}

export function registerAuthRoutes(app: Express) {
    // ============================================
    // Google OAuth Routes
    // ============================================

    // Initiate Google OAuth
    app.get(
        "/api/auth/google",
        passport.authenticate("google", { scope: ["profile", "email"] })
    );

    // Google OAuth callback
    app.get(
        "/api/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/login?error=google_auth_failed",
        }),
        (req, res) => {
            // Successful authentication
            res.redirect("/");
        }
    );

    // ============================================
    // Phone OTP Routes
    // ============================================

    const phoneSchema = z.object({
        phone: z.string().min(10).max(15),
    });

    const otpVerifySchema = z.object({
        phone: z.string().min(10).max(15),
        code: z.string().length(6),
    });

    // Send OTP to phone
    app.post("/api/auth/phone/send-otp", async (req, res) => {
        try {
            const { phone } = phoneSchema.parse(req.body);
            const result = await sendOtp(phone);

            if (result.success) {
                res.json({
                    success: true,
                    message: "OTP sent successfully",
                    expiresAt: result.expiresAt,
                });
            } else {
                res.status(500).json({ message: "Failed to send OTP" });
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid phone number" });
            }
            throw err;
        }
    });

    // Verify OTP
    app.post("/api/auth/phone/verify-otp", async (req, res) => {
        try {
            const { phone, code } = otpVerifySchema.parse(req.body);
            const isValid = await verifyOtp(phone, code);

            if (!isValid) {
                return res.status(400).json({ message: "Invalid or expired OTP" });
            }

            // Get or create user
            const user = await getOrCreateUserByPhone(phone);

            // Log in the user
            req.login(
                {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    publicKey: user.publicKey,
                },
                (err) => {
                    if (err) {
                        return res.status(500).json({ message: "Login failed" });
                    }
                    res.json({
                        success: true,
                        user: {
                            id: user.id,
                            email: user.email,
                            phone: user.phone,
                            name: user.name,
                            avatarUrl: user.avatarUrl,
                        },
                    });
                }
            );
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid OTP format" });
            }
            throw err;
        }
    });

    // ============================================
    // Session Routes
    // ============================================

    // Get current user
    app.get("/api/auth/me", (req, res) => {
        if (req.isAuthenticated() && req.user) {
            res.json({
                id: req.user.id,
                email: req.user.email,
                phone: req.user.phone,
                name: req.user.name,
                avatarUrl: req.user.avatarUrl,
                publicKey: req.user.publicKey,
            });
        } else {
            res.status(401).json({ message: "Not authenticated" });
        }
    });

    // Update user profile (name, publicKey)
    app.patch("/api/auth/me", requireAuth, async (req, res) => {
        const updateSchema = z.object({
            name: z.string().min(1).max(100).optional(),
            publicKey: z.string().optional(),
        });

        try {
            const data = updateSchema.parse(req.body);
            const user = await storage.updateUser(req.user!.id, data);
            res.json({
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                avatarUrl: user.avatarUrl,
                publicKey: user.publicKey,
            });
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid data" });
            }
            throw err;
        }
    });

    // Logout
    app.post("/api/auth/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "Logout failed" });
            }
            req.session.destroy((sessionErr) => {
                if (sessionErr) {
                    console.error("Session destroy error:", sessionErr);
                }
                res.clearCookie("connect.sid");
                res.json({ success: true });
            });
        });
    });
}
