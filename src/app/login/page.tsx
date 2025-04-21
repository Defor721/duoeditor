"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github");
    } catch (error) {
      console.error(error);
      setIsLoading(false); // 에러 발생 시 로딩 해제
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          🔐 로그인
        </h1>
        <p className="text-gray-600 mb-8">
          GitHub 계정으로 로그인하고
          <br />
          실시간 협업 문서 편집을 시작하세요.
        </p>

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className={`w-full py-3 rounded-full transition 
            ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            } 
            text-white`}
        >
          {isLoading ? "로딩 중..." : "🚀 GitHub로 계속하기"}
        </button>

        <div className="mt-6 text-sm text-gray-400">
          계정이 없다면? GitHub에서 무료로 만들 수 있어요.
        </div>
      </div>
    </main>
  );
}
