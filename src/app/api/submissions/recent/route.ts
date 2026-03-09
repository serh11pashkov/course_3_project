import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/db/server";
import type { DbSubmission } from "@/lib/db/types";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as
      | "student"
      | "teacher"
      | null
      | undefined;

    const db = getAdminDb();

    if (role === "teacher") {
      // Teacher: show most recent submissions for their courses.
      const coursesSnap = await db
        .collection("courses")
        .where("teacherId", "==", userId)
        .limit(50)
        .get();
      const courseIds = coursesSnap.docs.map((d) => d.id);
      if (!courseIds.length) return NextResponse.json({ submissions: [] });

      // Firestore "in" max 10. Chunk courseIds.
      const chunks: string[][] = [];
      for (let i = 0; i < courseIds.length; i += 10)
        chunks.push(courseIds.slice(i, i + 10));

      const results: Array<{ id: string } & Omit<DbSubmission, "id">> = [];
      for (const chunk of chunks) {
        const snap = await db
          .collection("submissions")
          .where("courseId", "in", chunk)
          .limit(50)
          .get();
        results.push(
          ...snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DbSubmission, "id">),
          })),
        );
      }
      results.sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1));

      const top = results.slice(0, 10);
      const studentIds = Array.from(new Set(top.map((s) => s.studentId)));
      const usersById: Record<string, string> = {};

      for (let i = 0; i < studentIds.length; i += 10) {
        const idsChunk = studentIds.slice(i, i + 10);
        const usersSnap = await db
          .collection("users")
          .where("__name__", "in", idsChunk)
          .get();
        for (const doc of usersSnap.docs) {
          const data = doc.data() as { name?: string; email?: string };
          usersById[doc.id] =
            data.name?.trim() || data.email?.trim() || "Студент";
        }
      }

      const withNames = top.map((s) => ({
        ...s,
        studentName: usersById[s.studentId] ?? "Студент",
      }));

      return NextResponse.json({ submissions: withNames });
    }

    // Student: show their recent submissions.
    const snap = await db
      .collection("submissions")
      .where("studentId", "==", userId)
      .limit(100)
      .get();

    const submissions = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<DbSubmission, "id">) }))
      .sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1))
      .slice(0, 3);

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Recent submissions fallback:", error);
    // Always return valid JSON so client parsing never crashes.
    return NextResponse.json({ submissions: [] }, { status: 200 });
  }
}
