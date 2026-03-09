import { NextResponse } from "next/server";
import { requireRole } from "@/lib/db/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await requireRole("teacher");
  const teacherId = (session.user as any).id as string;
  const { courseId } = await params;
  const body = await req.json().catch(() => null);

  const title = body?.title?.toString().trim();
  const description = body?.description?.toString().trim();

  if (!title || !description) {
    return NextResponse.json(
      { error: "Потрібно вказати назву та опис курсу." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();
  if (!courseDoc.exists) {
    return NextResponse.json({ error: "Курс не знайдено." }, { status: 404 });
  }

  const course = courseDoc.data() as { teacherId?: string };
  if (course.teacherId !== teacherId) {
    return NextResponse.json({ error: "Заборонено." }, { status: 403 });
  }

  await courseRef.set({ title, description }, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await requireRole("teacher");
  const teacherId = (session.user as any).id as string;
  const { courseId } = await params;

  const db = getAdminDb();
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();
  if (!courseDoc.exists) {
    return NextResponse.json({ error: "Курс не знайдено." }, { status: 404 });
  }

  const course = courseDoc.data() as { teacherId?: string };
  if (course.teacherId !== teacherId) {
    return NextResponse.json({ error: "Заборонено." }, { status: 403 });
  }

  // Delete course assignments, then course document.
  const assignmentsSnap = await db
    .collection("assignments")
    .where("courseId", "==", courseId)
    .limit(500)
    .get();

  const batch = db.batch();
  assignmentsSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(courseRef);
  await batch.commit();

  return NextResponse.json({ ok: true });
}
