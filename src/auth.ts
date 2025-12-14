import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Line from "next-auth/providers/line";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/db/client";
import { env } from "@/env";

// Build providers array dynamically
const providers: Provider[] = [
  Google({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }),
  Resend({
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
  }),
];

// Add LINE provider if credentials are configured
if (env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET) {
  providers.push(
    Line({
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch memberships and platform admin status
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              select: {
                tenantId: true,
                role: true,
              },
            },
            platformAdmin: {
              select: {
                id: true,
                level: true,
              },
            },
          },
        });

        if (userData) {
          (session.user as unknown as Record<string, unknown>).memberships = userData.memberships;
          (session.user as unknown as Record<string, unknown>).platformAdmin = userData.platformAdmin;
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    },
  },
});
