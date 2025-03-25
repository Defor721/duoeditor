import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("collab-editor");
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json(
        { message: "docId가 필요합니다." },
        { status: 400 }
      );
    }

    const doc = await db.collection("documents").findOne({ docId });

    if (!doc) {
      return NextResponse.json(
        { message: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        docId: doc.docId,
        title: doc.title,
        content: doc.content,
        ownerId: doc.ownerId,
        collaborators: doc.collaborators || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 에러" }, { status: 500 });
  }
}
