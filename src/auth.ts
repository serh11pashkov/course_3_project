import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  getOrCreateUserByEmail,
  verifyUserCredentials,
} from "@/lib/firebase/users";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await verifyUserCredentials(email, password);
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          needsRole: !user.role,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (trigger === "update" && session) {
        const nextName =
          (session as any).name ?? (session as any).user?.name ?? undefined;
        const nextEmail =
          (session as any).email ?? (session as any).user?.email ?? undefined;

        if (typeof nextName === "string") token.name = nextName;
        if (typeof nextEmail === "string") token.email = nextEmail;
        if ("role" in session) token.role = session.role ?? null;
        if ("needsRole" in session)
          token.needsRole = Boolean(session.needsRole);
      }

      if (user) {
        token.userId = (user as any).id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role ?? null;
        token.needsRole = Boolean((user as any).needsRole);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role ?? null;
        (session.user as any).needsRole = Boolean((token as any).needsRole);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Ensure we always stay on-site.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
