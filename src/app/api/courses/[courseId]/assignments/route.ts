import { NextResponse } from "next/server";
import {
  requireSession,
  listAssignmentsByCourse,
  getCourseById,
  getStudentEnrollment,
} from "@/lib/db/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await requireSession();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const { courseId } = await params;

  const course = await getCourseById(courseId);
  if (!course) return new NextResponse("Not found", { status: 404 });

  if (role === "teacher" && course.teacherId !== userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (role === "student") {
    const enrollment = await getStudentEnrollment(userId, courseId);
    if (!enrollment || enrollment.status !== "active") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const assignments = await listAssignmentsByCourse(courseId);
  return NextResponse.json({ assignments });
}
