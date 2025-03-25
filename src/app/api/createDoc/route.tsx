// app/api/createDoc/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const client = await clientPromise;
  const db = client.db("collab-editor");

  const docId = `doc-${Math.random().toString(36).substring(2, 10)}`;

  await db.collection("documents").insertOne({
    docId,
    title: "제목 없음",
    content: "",
    ownerId: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ docId }, { status: 201 });
}
