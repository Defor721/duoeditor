"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup"; // ✅ 최신 패키지 사용
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// ✅ CodeMirror 동적 로드 (SSR 방지)
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

export default function Home() {
  const [docId, setDocId] = useState("");
  const [content, setContent] = useState(""); // ✅ 문서 내용 상태 추가
  const [wsProvider, setWsProvider] = useState<WebsocketProvider | null>(null);

  // ✅ 새 문서 ID 생성 함수
  const generateDocId = () =>
    `doc-${Math.random().toString(36).substring(2, 9)}`;

  // ✅ 문서 생성 버튼 클릭 시 실행
  const handleCreateNewDoc = async () => {
    const newDocId = generateDocId();
    setDocId(newDocId);
    setContent(""); // 새 문서이므로 내용 초기화

    // ✅ 새 문서를 MongoDB에 저장 (saveDoc API 호출)
    await fetch("/api/saveDoc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId: newDocId, content: "" }),
    });
  };

  useEffect(() => {
    if (!docId) return;

    // ✅ MongoDB에서 기존 문서 불러오기
    fetch(`/api/getDoc?docId=${docId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          setContent(data.content); // 불러온 문서 내용 적용
        }
      });

    // ✅ WebSocket 연결 및 실시간 편집 적용
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:4000", docId, ydoc);
    setWsProvider(provider);

    // ✅ 자동 저장 기능 (5초마다 저장)
    const saveInterval = setInterval(() => {
      fetch("/api/saveDoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, content }),
      });
    }, 5000);

    return () => {
      clearInterval(saveInterval);
      provider.destroy();
    };
  }, [docId, content]);

  return (
    <div>
      <h1>📝 실시간 협업 에디터</h1>

      {/* ✅ 새 문서 생성 버튼 */}
      <button onClick={handleCreateNewDoc} style={{ marginRight: "10px" }}>
        ➕ 새 문서 만들기
      </button>

      {/* ✅ 사용자가 직접 문서 ID 입력 */}
      <input
        type="text"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
        placeholder="문서 ID 입력"
      />

      {/* ✅ CodeMirror 편집기 추가 */}
      {docId && (
        <CodeMirror
          value={content}
          height="400px"
          extensions={[basicSetup()]} // ✅ 최신 패키지로 적용
          onChange={(value) => setContent(value)} // 사용자가 입력하면 상태 업데이트
        />
      )}
    </div>
  );
}
