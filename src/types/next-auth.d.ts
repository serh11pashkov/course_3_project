import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      role?: "student" | "teacher" | null;
      needsRole?: boolean;
    };
    role?: "student" | "teacher" | null;
    needsRole?: boolean;
  }

  interface User {
    id?: string;
    role?: "student" | "teacher" | null;
    needsRole?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "student" | "teacher" | null;
    needsRole?: boolean;
  }
}
