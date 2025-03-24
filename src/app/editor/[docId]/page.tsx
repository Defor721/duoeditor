// app/editor/[docId]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

// 동적 import
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

export default function EditorPage() {
  const { docId } = useParams(); // ✅ [docId] from URL
  const [content, setContent] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;

    // 1. 문서 불러오기
    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent(data.content);
      });

    // 2. WebSocket 연결
    const socket = new WebSocket("ws://localhost:3001");
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
        body: JSON.stringify({ docId, content }),
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
      <h1 className="text-2xl font-bold mb-4">📝 에디터: {docId}</h1>

      <button
        onClick={handleSave}
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        💾 저장
      </button>

      <CodeMirror
        value={content}
        height="400px"
        extensions={[]}
        onChange={handleContentChange}
      />
    </div>
  );
}
