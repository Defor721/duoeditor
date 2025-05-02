"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

type Collaborator = { id: string; email: string };
type OnlineUser = { email: string; name?: string };

export default function EditorPage() {
  const { docId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;

    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title || "");
        setCategory(data.category || "");
        setContent(data.content || "");
      });

    fetch(`/api/getCollaborators?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => setCollaborators(data || []));

    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join",
          docId,
          user: {
            email: session?.user?.email,
            name: session?.user?.name,
          },
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") setContent(data.content);
      if (data.type === "users") setOnlineUsers(data.users || []);
    };

    return () => socket.close();
  }, [docId, session?.user?.email, session?.user?.name]);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "update", docId, content: value })
      );
    }
  };

  const handleSave = async () => {
    if (!docId || !title.trim() || !category)
      return alert("입력값을 확인해주세요.");

    try {
      setLoading(true);
      const res = await fetch("/api/saveDoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, title, category, content }),
      });

      alert(res.ok ? "💾 저장 완료!" : "❌ 저장 실패");
    } catch (e) {
      console.error(e);
      alert("❌ 저장 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!collaboratorEmail) return;
    try {
      const res = await fetch("/api/inviteCollaborator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, collaboratorEmail }),
      });

      if (res.ok) {
        setCollaboratorEmail("");
        const updated = await fetch(`/api/getCollaborators?docId=${docId}`);
        setCollaborators(await updated.json());
      } else alert("❌ 초대 실패");
    } catch (e) {
      console.error(e);
    }
  };

  if (!isMounted) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* 헤더 */}
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold text-gray-800">📝 DuoEditor</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 대시보드로
        </button>
      </header>

      {/* 문서 정보 */}
      <section className="space-y-4">
        <p className="text-xs text-gray-400">문서 ID: {docId}</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="📌 제목을 입력하세요"
          className="w-full px-4 py-3 border rounded-lg text-lg font-semibold shadow-sm focus:ring-2 ring-blue-200"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg text-gray-700 shadow-sm focus:ring-2 ring-blue-200"
        >
          <option value="">📂 카테고리 선택</option>
          <option value="기획">기획</option>
          <option value="개발">개발</option>
          <option value="디자인">디자인</option>
          <option value="기타">기타</option>
        </select>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          저장하기
        </button>
      </section>

      {/* 실시간 접속자 */}
      {onlineUsers.length > 0 && (
        <section className="bg-blue-50 border border-blue-100 p-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-2 text-blue-800">
            🟢 접속 중인 사용자
          </p>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((user, idx) => (
              <span
                key={idx}
                className="bg-white border border-blue-200 px-3 py-1 rounded-full text-sm text-blue-700 shadow-sm"
              >
                {user.name || user.email}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 협업자 초대 */}
      <section className="bg-white border p-4 rounded-lg shadow-sm">
        <p className="font-semibold mb-3 text-gray-800">👥 협업자 초대</p>
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            placeholder="이메일 입력"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 ring-blue-200"
          />
          <button
            onClick={handleInvite}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ 초대
          </button>
        </div>
        <p className="text-sm text-gray-500">
          에디터를 사용해 본 사용자만 초대할 수 있습니다. 본인 이메일은 초대
          불가합니다.
        </p>

        {collaborators.length > 0 && (
          <ul className="mt-3 text-sm text-gray-600 list-disc list-inside">
            {collaborators.map((user) => (
              <li key={user.id}>{user.email}</li>
            ))}
          </ul>
        )}
      </section>

      {/* 코드 에디터 */}
      <section className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <CodeMirror
          value={content}
          height="500px"
          extensions={[]}
          onChange={handleContentChange}
        />
      </section>
    </div>
  );
}
