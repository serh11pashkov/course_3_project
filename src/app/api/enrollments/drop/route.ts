import { NextResponse } from "next/server";
import { requireSession } from "@/lib/db/server";
import { dropCourseEnrollment } from "@/lib/db/server";

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = (session.user as any).id as string;

  const { courseId } = await req.json();

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 },
    );
  }

  try {
    await dropCourseEnrollment(userId, courseId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Drop error:", err);
    return NextResponse.json(
      { error: "Failed to drop course" },
      { status: 500 },
    );
  }
}
