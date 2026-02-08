import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./db";

// Extend Express types
declare global {
    namespace Express {
        interface User {
            id: string;
            email: string | null;
            phone: string | null;
            name: string | null;
            avatarUrl: string | null;
            publicKey: string | null;
        }
    }
}

// Serialize user to session
passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                avatarUrl: true,
                publicKey: true,
            },
        });
        done(null, user as Express.User | null);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    const avatarUrl = profile.photos?.[0]?.value;

                    // Find or create user
                    let user = await prisma.user.findUnique({
                        where: { googleId: profile.id },
                    });

                    if (!user && email) {
                        // Check if user exists with this email
                        user = await prisma.user.findUnique({
                            where: { email },
                        });

                        if (user) {
                            // Link Google account to existing user
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { googleId: profile.id, avatarUrl: avatarUrl || user.avatarUrl },
                            });
                        }
                    }

                    if (!user) {
                        // Create new user
                        user = await prisma.user.create({
                            data: {
                                googleId: profile.id,
                                email,
                                name: profile.displayName,
                                avatarUrl,
                            },
                        });
                    }

                    done(null, {
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        publicKey: user.publicKey,
                    });
                } catch (err) {
                    done(err as Error, undefined);
                }
            }
        )
    );
}

export default passport;
