import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import clientPromise from "@/app/lib/mongodb";
import { resend } from "@/app/lib/resend"; // ✅ 추가

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

    if (
      !docId ||
      typeof docId !== "string" ||
      !collaboratorEmail ||
      typeof collaboratorEmail !== "string"
    ) {
      return NextResponse.json(
        { message: "docId와 collaboratorEmail이 필요합니다." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collaboratorEmail)) {
      return NextResponse.json(
        { message: "올바른 이메일 형식이 아닙니다." },
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

    if (doc.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "문서에 대한 초대 권한이 없습니다." },
        { status: 403 }
      );
    }

    const user = await db
      .collection("users")
      .findOne({ email: collaboratorEmail });

    if (!user || !user._id) {
      return NextResponse.json(
        { message: "해당 이메일의 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const alreadyInvited = doc.collaborators?.includes(user._id.toString());

    if (alreadyInvited) {
      return NextResponse.json(
        { message: "이미 초대한 사용자입니다." },
        { status: 400 }
      );
    }

    // 초대 추가
    await db.collection("documents").updateOne(
      { docId },
      {
        $addToSet: { collaborators: user._id.toString() },
        $set: { updatedAt: new Date() },
      }
    );

    // ✅ 초대 메일 보내기
    await resend.emails.send({
      from: "DuoEditor <onboarding@resend.dev>",
      to: collaboratorEmail,
      subject: "DuoEditor 문서에 초대되었습니다",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>📄 DuoEditor 문서에 초대되었습니다!</h2>
          <p><b>${session.user.name || session.user.email}</b> 님이 당신을 문서에 초대했습니다.</p>
          <p><b>문서 제목:</b> ${doc.title || "제목 없음"}</p>
          <br/>
          <a href="https://duoeditor.vercel.app/editor/${docId}" style="background-color:#4f46e5;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">문서 열기</a>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "✅ 협업자가 성공적으로 초대되었습니다." },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ 협업자 초대 오류:", err);
    return NextResponse.json({ message: "서버 에러" }, { status: 500 });
  }
}
