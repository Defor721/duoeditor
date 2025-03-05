import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("collab-editor");
    const { docId, content } = await req.json();

    if (!docId || content === undefined) {
      return NextResponse.json(
        { message: "docId와 content가 필요합니다." },
        { status: 400 }
      );
    }

    await db
      .collection("documents")
      .updateOne({ docId }, { $set: { content } }, { upsert: true });

    return NextResponse.json({ message: "문서 저장 완료" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "서버 에러" }, { status: 500 });
  }
}
