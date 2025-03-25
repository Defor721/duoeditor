"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// 동적 import (CodeMirror)
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

export default function EditorPage() {
  const { docId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [isMounted, setIsMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorId, setCollaboratorId] = useState("");

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;

    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title || "");
        setContent(data.content || "");
        setOwnerId(data.ownerId || "");
        setCollaborators(data.collaborators || []);
      });

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
        body: JSON.stringify({ docId, title, content }),
      });

      if (res.ok) alert("💾 저장 완료!");
      else alert("❌ 저장 실패");
    } catch (error) {
      console.error("저장 오류:", error);
    }
  };

  const handleInvite = async () => {
    if (!collaboratorId) return;

    try {
      const res = await fetch("/api/inviteCollaborator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, collaboratorId }),
      });

      if (res.ok) {
        alert("✅ 협업자 초대 완료");
        setCollaboratorId("");
        // 업데이트된 협업자 목록 불러오기
        const updated = await fetch(`/api/getDoc?docId=${docId}`).then((r) =>
          r.json()
        );
        setCollaborators(updated.collaborators || []);
      } else {
        const data = await res.json();
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error("초대 오류:", err);
    }
  };

  if (!isMounted) return <div>Loading...</div>;

  const isOwner = session?.user?.id === ownerId;

  return (
    <div className="p-6">
      {/* 돌아가기 버튼 */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← 내 문서 목록으로 돌아가기
      </button>

      <h1 className="text-2xl font-bold mb-2">📝 에디터</h1>
      <p className="text-gray-500 text-sm mb-4">문서 ID: {docId}</p>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="문서 제목을 입력하세요"
        className="mb-4 w-full p-2 border rounded text-xl font-semibold"
      />

      {/* 저장 */}
      <button
        onClick={handleSave}
        className="mb-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        💾 저장
      </button>

      {/* ✅ 협업자 초대 - 오너만 */}
      {isOwner && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">👥 협업자 초대</h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={collaboratorId}
              onChange={(e) => setCollaboratorId(e.target.value)}
              placeholder="GitHub 유저 ID"
              className="border px-2 py-1 rounded w-64"
            />
            <button
              onClick={handleInvite}
              className="bg-blue-600 text-white px-4 py-1 rounded"
            >
              ➕ 초대
            </button>
          </div>
        </div>
      )}

      {/* 협업자 목록 */}
      {collaborators.length > 0 && (
        <div className="mb-6 text-sm text-gray-700">
          현재 협업자:{" "}
          <span className="font-medium">{collaborators.join(", ")}</span>
        </div>
      )}

      {/* 에디터 */}
      <CodeMirror
        value={content}
        height="400px"
        extensions={[]}
        onChange={handleContentChange}
      />
    </div>
  );
}
