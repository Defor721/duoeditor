// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import clientPromise from "../lib/mongodb";
import { NewDocButton } from "../components/UI/NewDocButton";
import LogoutButton from "@/app/components/UI/LogoutButton";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // MongoDB에서 로그인한 유저의 문서 가져오기
  const client = await clientPromise;
  const db = client.db("collab-editor");
  const docs = await db
    .collection("documents")
    .find({ ownerId: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        👋 {session.user?.name || "사용자"}님 환영합니다!
      </h1>

      <div className="mt-4 text-gray-600">
        <p>📧 이메일: {session.user?.email || "없음"}</p>
        <p>🆔 사용자 ID: {session.user?.id}</p>
      </div>
      <LogoutButton />

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">📄 내 문서 목록</h2>
        <div className="mt-10">
          <NewDocButton />
        </div>

        {docs.length === 0 ? (
          <p className="text-gray-500">작성한 문서가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc, index: number) => (
              <li
                key={doc._id.toString()}
                className={`p-4 rounded shadow transition ${
                  index === 0
                    ? "bg-yellow-100 border border-yellow-300"
                    : "bg-white"
                }`}
              >
                <Link href={`/editor/${doc.docId}`}>
                  <div className="cursor-pointer">
                    <strong>{doc.title || "제목 없음"}</strong>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.updatedAt).toLocaleString()}
                    </p>
                    {index === 0 && (
                      <span className="text-xs text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded mt-1 inline-block">
                        🕒 최근 편집됨
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
