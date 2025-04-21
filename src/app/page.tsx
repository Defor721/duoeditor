"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WelcomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

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
          onClick={handleSignIn}
          disabled={isLoading}
          className={`w-full max-w-xs mx-auto flex items-center justify-center gap-2
            px-8 py-3 rounded-full transition text-white
            ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }
          `}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              로딩 중...
            </>
          ) : (
            <>🚀 GitHub 로그인으로 시작하기</>
          )}
        </button>
      </div>

      <div className="mt-16 text-sm text-gray-500">
        GitHub 계정만 있으면 누구나 무료로 시작할 수 있어요.
      </div>
    </main>
  );
}
