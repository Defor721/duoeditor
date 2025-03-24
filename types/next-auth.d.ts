// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

// session.user 에 id 추가
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}
