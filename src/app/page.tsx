"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// ✅ 동적으로 CodeMirror 로딩 (서버 사이드 렌더링 방지)
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

const Home = () => {
  const [docId, setDocId] = useState("");
  const [content, setContent] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setIsMounted(true);

    const saved = localStorage.getItem("docId");
    if (saved) setDocId(saved);
  }, []);

  useEffect(() => {
    if (!docId) return;

    localStorage.setItem("docId", docId);

    // 문서 내용 불러오기 (MongoDB 등에서)
    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) setContent(data.content);
      });

    // WebSocket 연결
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

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "update", docId, content: value })
      );
    }
  };

  const handleSave = async () => {
    if (!docId) return alert("문서 ID가 없습니다!");

    try {
      const res = await fetch("/api/saveDoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, content }),
      });

      if (res.ok) {
        alert("💾 문서가 저장되었습니다!");
      } else {
        alert("❌ 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 저장 오류:", error);
    }
  };

  if (!isMounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📝 실시간 협업 에디터</h1>

      <button
        onClick={() =>
          setDocId(`doc-${Math.random().toString(36).substring(2, 9)}`)
        }
      >
        ➕ 새 문서 만들기
      </button>

      <input
        type="text"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
        placeholder="문서 ID 입력"
        style={{ marginLeft: "10px" }}
      />

      <button
        onClick={handleSave}
        style={{ marginLeft: "10px", backgroundColor: "lightgreen" }}
      >
        💾 저장
      </button>

      {docId && (
        <div style={{ marginTop: "20px" }}>
          <CodeMirror
            value={content}
            height="400px"
            extensions={[]}
            onChange={handleContentChange}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
