// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewDocButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createNewDoc = async () => {
    setLoading(true);

    const res = await fetch("/api/createDoc", {
      method: "POST",
    });

    if (!res.ok) {
      alert("문서 생성 실패");
      return;
    }

    const data = await res.json();
    router.push(`/editor/${data.docId}`);
  };

  return (
    <button
      onClick={createNewDoc}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      {loading ? "생성 중..." : "➕ 새 문서 만들기"}
    </button>
  );
}
