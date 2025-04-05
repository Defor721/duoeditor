"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white to-gray-100 px-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
          ✨ <span className="text-indigo-600">DuoEditor</span>에 오신 걸
          환영합니다!
        </h1>
        <p className="text-lg text-gray-700 mb-10">
          실시간 협업, 자동 저장, 팀 공유까지 가능한 차세대 문서 에디터.
          <br />
          이제 함께, 더 나은 문서를 만들어보세요.
        </p>
        <button
          onClick={() => signIn("github")}
          className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition"
        >
          🚀 GitHub 로그인으로 시작하기
        </button>
      </div>

      <div className="mt-16 text-sm text-gray-500">
        GitHub 계정만 있으면 누구나 무료로 시작할 수 있어요.
      </div>
    </main>
  );
}
