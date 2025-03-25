"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

// CodeMirror 동적 import
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

export default function EditorPage() {
  const { docId } = useParams();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(""); // 🔥 추가
  const [content, setContent] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;

    // 문서 불러오기
    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent(data.content);
        if (data.title) setTitle(data.title);
        if (data.category) setCategory(data.category); // 🔥 카테고리 설정
      });

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
        body: JSON.stringify({ docId, title, category, content }), // 🔥 category 포함
      });

      if (res.ok) alert("💾 저장 완료!");
      else alert("❌ 저장 실패");
    } catch (error) {
      console.error("저장 오류:", error);
    }
  };

  if (!isMounted) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">📝 에디터</h1>
      <p className="text-gray-500 text-sm mb-4">문서 ID: {docId}</p>

      {/* 제목 입력 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="문서 제목을 입력하세요"
        className="mb-4 w-full p-2 border rounded text-xl font-semibold"
      />

      {/* 🔥 카테고리 선택 */}
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
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        💾 저장
      </button>

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
