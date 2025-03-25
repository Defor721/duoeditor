import GitHubProvider from "next-auth/providers/github";
import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import clientPromise from "@/app/lib/mongodb"; // Mongo 연결 추가

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = token.sub!;
      return session;
    },

    // ✅ 로그인 성공 시 유저를 users 컬렉션에 upsert
    async signIn({ user }) {
      const client = await clientPromise;
      const db = client.db("collab-editor");

      await db.collection("users").updateOne(
        { email: user.email }, // 기준: 이메일
        {
          $setOnInsert: {
            id: user.id, // next-auth의 내부 id
            email: user.email,
            name: user.name,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
