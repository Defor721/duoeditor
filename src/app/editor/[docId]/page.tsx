"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";

// CodeMirror 동적 import
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

type Collaborator = {
  id: string;
  email: string;
};

export default function EditorPage() {
  const { docId } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]); // 🔥 협업자 목록
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;

    // 문서 데이터 불러오기
    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent(data.content);
        if (data.title) setTitle(data.title);
        if (data.category) setCategory(data.category);
      });

    // 협업자 목록 불러오기
    fetch(`/api/getCollaborators?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => setCollaborators(data || []));

    // WebSocket 연결
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", docId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") {
        setContent(data.content);
      }
    };

    return () => {
      socket.close();
    };
  }, [docId]);

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

    try {
      const res = await fetch("/api/saveDoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, title, category, content }),
      });

      if (res.ok) alert("💾 저장 완료!");
      else alert("❌ 저장 실패");
    } catch (error) {
      console.error("저장 오류:", error);
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
        // 초대한 후 목록 새로고침
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">DuoEditor</h1>

        {/* 🔙 대시보드 이동 */}
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 대시보드로 돌아가기
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-4">문서 ID: {docId}</p>

      {/* 제목 입력 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="문서 제목을 입력하세요"
        className="mb-4 w-full p-2 border rounded text-xl font-semibold"
      />

      {/* 카테고리 선택 */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mb-4 w-full p-2 border rounded"
      >
        <option value="">카테고리 선택</option>
        <option value="기획">기획</option>
        <option value="개발">개발</option>
        <option value="디자인">디자인</option>
        <option value="기타">기타</option>
      </select>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        className="mb-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        💾 저장
      </button>

      {/* 🔥 협업자 초대 기능 */}
      <div className="mb-6">
        <div className="flex gap-2 items-center mb-2">
          <input
            type="email"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            placeholder="협업자 이메일 입력"
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={handleInvite}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            ➕ 초대
          </button>
        </div>

        {/* 🔍 협업자 목록 */}
        {collaborators.length > 0 && (
          <div className="bg-gray-100 p-3 rounded">
            <p className="font-semibold mb-1">👥 초대된 협업자</p>
            <ul className="list-disc ml-5 text-sm text-gray-700">
              {collaborators.map((user) => (
                <li key={user.id}>{user.email}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 코드 에디터 */}
      <CodeMirror
        value={content}
        height="400px"
        extensions={[]}
        onChange={handleContentChange}
      />
    </div>
  );
}
