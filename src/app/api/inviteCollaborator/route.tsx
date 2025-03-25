// app/api/inviteCollaborator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import clientPromise from "@/app/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { docId, collaboratorEmail } = await req.json();

    if (!docId || !collaboratorEmail) {
      return NextResponse.json(
        { message: "docId와 collaboratorEmail이 필요합니다." },
        { status: 400 }
      );
    }
    if (collaboratorEmail === session.user.email) {
      return NextResponse.json(
        { message: "본인을 협업자로 초대할 수 없습니다." },
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

    // 권한 체크: 소유자만 초대 가능
    if (doc.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "문서에 대한 초대 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 이메일로 사용자 조회
    const user = await db
      .collection("users")
      .findOne({ email: collaboratorEmail });

    if (!user || !user.id) {
      return NextResponse.json(
        { message: "해당 이메일의 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 초대된 경우 중복 추가 방지
    await db.collection("documents").updateOne(
      { docId },
      {
        $addToSet: { collaborators: user.id },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      { message: "✅ 협업자가 성공적으로 초대되었습니다." },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ 협업자 초대 오류:", err);
    return NextResponse.json({ message: "서버 에러" }, { status: 500 });
  }
}
