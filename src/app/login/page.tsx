"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

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
          onClick={() => signIn("github")}
          className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition"
        >
          🚀 GitHub로 계속하기
        </button>

        <div className="mt-6 text-sm text-gray-400">
          계정이 없다면? GitHub에서 무료로 만들 수 있어요.
        </div>
      </div>
    </main>
  );
}
