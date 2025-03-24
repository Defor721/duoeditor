// app/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <main className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">
        ✨ DuoEditor에 오신 걸 환영합니다!
      </h1>
      <p className="mb-6 text-gray-600">
        실시간 협업, 자동 저장, 공유 가능한 문서 에디터
      </p>
      <button
        onClick={() => signIn("github")}
        className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800"
      >
        GitHub 로그인으로 시작하기
      </button>
    </main>
  );
}
