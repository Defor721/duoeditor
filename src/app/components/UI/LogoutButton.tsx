// app/components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
    >
      로그아웃
    </button>
  );
}
