// app/login/page.tsx
"use client";
import { signIn, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard"); // 원하는 경로로 이동
    }
  }, [status, router]);

  return (
    <main className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">🔐 로그인</h1>

      <button
        onClick={() => signIn("github")}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
      >
        GitHub 계정으로 로그인
      </button>
    </main>
  );
}
