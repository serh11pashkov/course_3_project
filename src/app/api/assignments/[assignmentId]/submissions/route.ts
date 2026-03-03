import { NextResponse } from "next/server";
import { requireRole } from "@/lib/db/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { DbSubmission } from "@/lib/db/types";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  await requireRole("teacher");
  const { assignmentId } = await params;

  const db = getAdminDb();
  const snap = await db
    .collection("submissions")
    .where("assignmentId", "==", assignmentId)
    .limit(300)
    .get();

  const submissions = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DbSubmission, "id">) }))
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  const studentIds = Array.from(new Set(submissions.map((s) => s.studentId)));
  const usersById: Record<string, string> = {};

  for (let i = 0; i < studentIds.length; i += 10) {
    const idsChunk = studentIds.slice(i, i + 10);
    const usersSnap = await db
      .collection("users")
      .where("__name__", "in", idsChunk)
      .get();

    for (const doc of usersSnap.docs) {
      const data = doc.data() as { name?: string; email?: string };
      usersById[doc.id] = data.name?.trim() || data.email?.trim() || "Студент";
    }
  }

  const withStudentNames = submissions.map((s) => ({
    ...s,
    studentName: usersById[s.studentId] ?? "Студент",
  }));

  return NextResponse.json({ submissions: withStudentNames });
}
