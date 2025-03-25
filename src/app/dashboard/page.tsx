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
  const categories = ["기획", "개발", "디자인", "기타"];
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
        <div className="mt-4 mb-6">
          <NewDocButton />
        </div>

        {docs.length === 0 ? (
          <p className="text-gray-500">작성한 문서가 없습니다.</p>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const filteredDocs = docs.filter((doc) => doc.category === cat);

              if (filteredDocs.length === 0) return null;

              return (
                <div key={cat}>
                  <h3 className="text-lg font-bold mb-2">📂 {cat}</h3>
                  <ul className="space-y-2">
                    {filteredDocs.map((doc) => (
                      <li
                        key={doc._id.toString()}
                        className="bg-white shadow p-4 rounded hover:bg-gray-50 transition"
                      >
                        <Link href={`/editor/${doc.docId}`}>
                          <div>
                            <strong>{doc.title || "제목 없음"}</strong>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(doc.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
