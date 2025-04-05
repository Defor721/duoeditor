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

  const client = await clientPromise;
  const db = client.db("collab-editor");
  const docs = await db
    .collection("documents")
    .find({ ownerId: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  return (
    <main className="min-h-screen px-6 py-10 bg-gray-50">
      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          👋 안녕하세요, {session.user?.name || "사용자"}님!
        </h1>
        <p className="text-gray-600">오늘도 멋진 협업을 시작해볼까요?</p>
        <div className="mt-4 text-sm text-gray-500 space-y-1">
          <p>📧 {session.user?.email}</p>
          <p>🆔 ID: {session.user?.id}</p>
        </div>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>

      {/* 문서 생성 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📄 내 문서</h2>
        <NewDocButton />
      </div>

      {/* 문서 리스트 */}
      {docs.length === 0 ? (
        <div className="text-center text-gray-500 py-20 border rounded bg-white shadow">
          아직 문서가 없습니다. <br />
          <span className="text-indigo-600 font-medium">
            새 문서를 만들어보세요!
          </span>
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => {
            const filteredDocs = docs.filter((doc) => doc.category === cat);
            if (filteredDocs.length === 0) return null;

            return (
              <section key={cat}>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  📂 {cat}
                </h3>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocs.map((doc) => (
                    <li
                      key={doc._id.toString()}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4"
                    >
                      <Link href={`/editor/${doc.docId}`}>
                        <div>
                          <h4 className="font-semibold text-gray-900 truncate">
                            {doc.title || "제목 없음"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            마지막 수정:{" "}
                            {new Date(doc.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
