// app/api/inviteCollaborator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import clientPromise from "@/app/lib/mongodb";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { docId, collaboratorId } = await req.json();

  if (!docId || !collaboratorId) {
    return NextResponse.json(
      { message: "docId와 collaboratorId가 필요합니다." },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("collab-editor");

  const doc = await db.collection("documents").findOne({ docId });

  if (!doc) {
    return NextResponse.json(
      { message: "문서를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (doc.ownerId !== session.user.id) {
    return NextResponse.json(
      { message: "초대 권한이 없습니다." },
      { status: 403 }
    );
  }

  await db.collection("documents").updateOne(
    { docId },
    { $addToSet: { collaborators: collaboratorId } } // 중복 방지
  );

  return NextResponse.json({ message: "협업자 초대 완료" }, { status: 200 });
}
