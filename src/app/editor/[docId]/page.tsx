"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

type Collaborator = {
  id: string;
  email: string;
};

type OnlineUser = {
  email: string;
  name?: string;
};

export default function EditorPage() {
  const { docId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false); // ✅ 로딩 추가

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;

    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent(data.content);
        if (data.title) setTitle(data.title);
        if (data.category) setCategory(data.category);
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

      if (data.type === "update") {
        setContent(data.content);
      }

      if (data.type === "users") {
        setOnlineUsers(data.users || []);
      }
    };

    return () => {
      socket.close();
    };
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
    if (!docId || typeof docId !== "string") return alert("문서 ID 오류");
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    try {
      setLoading(true);

      const res = await fetch("/api/saveDoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, title, category, content }),
      });

      if (res.ok) alert("💾 저장 완료!");
      else alert("❌ 저장 실패");
    } catch (error) {
      console.error("저장 오류:", error);
      alert("❌ 저장 중 에러 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!collaboratorEmail) return alert("이메일을 입력해주세요.");

    try {
      const res = await fetch("/api/inviteCollaborator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, collaboratorEmail }),
      });

      if (res.ok) {
        alert("✅ 협업자가 초대되었습니다!");
        setCollaboratorEmail("");
        const updated = await fetch(`/api/getCollaborators?docId=${docId}`);
        const data = await updated.json();
        setCollaborators(data || []);
      } else {
        alert("❌ 초대 실패");
      }
    } catch (err) {
      console.error("초대 오류:", err);
    }
  };

  if (!isMounted) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800">📝 DuoEditor</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 대시보드로 돌아가기
        </button>
      </div>

      {/* 문서 정보 */}
      <p className="text-sm text-gray-400 mb-2">문서 ID: {docId}</p>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="📌 문서 제목을 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">📂 카테고리 선택</option>
          <option value="기획">기획</option>
          <option value="개발">개발</option>
          <option value="디자인">디자인</option>
          <option value="기타">기타</option>
        </select>
      </div>

      {/* 저장 버튼 */}
      <div className="mb-8">
        <button
          onClick={handleSave}
          disabled={loading}
          className="relative bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              저장 중...
            </>
          ) : (
            "💾 저장하기"
          )}
        </button>
      </div>

      {/* 실시간 접속자 목록 */}
      {onlineUsers.length > 0 && (
        <div className="mb-8 bg-blue-50 border border-blue-100 p-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-2 text-blue-800">
            🟢 현재 접속 중인 사용자
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
        </div>
      )}

      {/* 협업자 초대 */}
      <div className="mb-8 p-4 bg-white border rounded-lg shadow-sm">
        <p className="font-semibold mb-3 text-gray-800">👥 협업자 초대</p>

        <div className="flex flex-col gap-1 mb-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              placeholder="이메일 입력"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={handleInvite}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              ➕ 초대
            </button>
          </div>

          <p className="text-sm text-gray-500 ml-1">
            에디터를 사용해 본 사용자만 초대할 수 있습니다. 본인 이메일은 초대할
            수 없습니다.
          </p>
        </div>

        {collaborators.length > 0 && (
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-700 mb-1">
              📋 초대된 협업자
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {collaborators.map((user) => (
                <li key={user.id}>{user.email}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 코드 에디터 */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <CodeMirror
          value={content}
          height="400px"
          extensions={[]}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
