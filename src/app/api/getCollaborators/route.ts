import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json(
        { message: "docId가 필요합니다." },
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

    const collaboratorIds = doc.collaborators || [];

    if (!Array.isArray(collaboratorIds) || collaboratorIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 이메일로 사용자 정보 조회
    const users = await db
      .collection("users")
      .find({ id: { $in: collaboratorIds } }) // ID 기준 조회
      .project({ _id: 0, id: 1, email: 1 }) // 필요한 필드만
      .toArray();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("getCollaborators 오류:", error);
    return NextResponse.json({ message: "서버 에러" }, { status: 500 });
  }
}
