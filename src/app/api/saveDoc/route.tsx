// app/api/saveDoc/route.ts
import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("collab-editor");

    const { docId, content } = await req.json();

    if (!docId || content === undefined) {
      return NextResponse.json(
        { message: "docId와 content가 필요합니다." },
        { status: 400 }
      );
    }

    const existing = await db.collection("documents").findOne({ docId });

    if (existing) {
      // 🔒 권한 확인: 소유자만 저장 가능
      if (existing.ownerId !== session.user.id) {
        return NextResponse.json(
          { message: "문서에 대한 권한이 없습니다." },
          { status: 403 }
        );
      }

      await db
        .collection("documents")
        .updateOne({ docId }, { $set: { content, updatedAt: new Date() } });
    } else {
      // 문서가 없으면 새로 생성
      await db.collection("documents").insertOne({
        docId,
        content,
        title: "", // 선택: 처음엔 제목 없음
        ownerId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ message: "문서 저장 완료" }, { status: 200 });
  } catch (error) {
    console.error("문서 저장 오류:", error);
    return NextResponse.json({ message: "서버 에러" }, { status: 500 });
  }
}
