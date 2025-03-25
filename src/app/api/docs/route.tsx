// app/api/docs/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import clientPromise from "../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(); // default DB
    const docs = await db
      .collection("documents")
      .find({ ownerId: session.user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(docs);
  } catch (error) {
    console.error("❌ Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
