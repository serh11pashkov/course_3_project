import { NextResponse } from "next/server";
import { requireRole } from "@/lib/db/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const session = await requireRole("teacher");
  const teacherId = (session.user as any).id as string;
  const { assignmentId } = await params;
  const body = await req.json().catch(() => null);

  const title = body?.title?.toString().trim();
  const description = body?.description?.toString().trim();
  const dueDate = body?.dueDate?.toString();

  if (!title || !description || !dueDate) {
    return NextResponse.json(
      { error: "Потрібно вказати назву, опис і дедлайн." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const assignmentRef = db.collection("assignments").doc(assignmentId);
  const assignmentDoc = await assignmentRef.get();
  if (!assignmentDoc.exists) {
    return NextResponse.json(
      { error: "Завдання не знайдено." },
      { status: 404 },
    );
  }

  const assignment = assignmentDoc.data() as { courseId?: string };
  if (!assignment.courseId) {
    return NextResponse.json(
      { error: "Некоректне завдання." },
      { status: 400 },
    );
  }

  const courseDoc = await db
    .collection("courses")
    .doc(assignment.courseId)
    .get();
  const course = courseDoc.data() as { teacherId?: string } | undefined;
  if (!courseDoc.exists || course?.teacherId !== teacherId) {
    return NextResponse.json({ error: "Заборонено." }, { status: 403 });
  }

  await assignmentRef.set({ title, description, dueDate }, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const session = await requireRole("teacher");
  const teacherId = (session.user as any).id as string;
  const { assignmentId } = await params;

  const db = getAdminDb();
  const assignmentRef = db.collection("assignments").doc(assignmentId);
  const assignmentDoc = await assignmentRef.get();
  if (!assignmentDoc.exists) {
    return NextResponse.json(
      { error: "Завдання не знайдено." },
      { status: 404 },
    );
  }

  const assignment = assignmentDoc.data() as { courseId?: string };
  if (!assignment.courseId) {
    return NextResponse.json(
      { error: "Некоректне завдання." },
      { status: 400 },
    );
  }

  const courseDoc = await db
    .collection("courses")
    .doc(assignment.courseId)
    .get();
  const course = courseDoc.data() as { teacherId?: string } | undefined;
  if (!courseDoc.exists || course?.teacherId !== teacherId) {
    return NextResponse.json({ error: "Заборонено." }, { status: 403 });
  }

  await assignmentRef.delete();
  return NextResponse.json({ ok: true });
}
