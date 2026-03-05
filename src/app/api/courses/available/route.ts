import { NextResponse } from "next/server";
import { requireSession } from "@/lib/db/server";
import { listCourses, getStudentEnrollment } from "@/lib/db/server";

export const revalidate = 120; // Cache for 120 seconds

export async function GET() {
  const session = await requireSession();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as
    | "student"
    | "teacher"
    | null
    | undefined;

  if (role !== "student") {
    return NextResponse.json({ courses: [] });
  }

  const allCourses = await listCourses();

  // Filter out courses the student is already enrolled in
  const availableCourses = await Promise.all(
    allCourses.map(async (course) => {
      const enrollment = await getStudentEnrollment(userId, course.id);
      return { course, isEnrolled: !!enrollment };
    }),
  );

  const filtered = availableCourses
    .filter((item) => !item.isEnrolled)
    .map((item) => item.course);

  const response = NextResponse.json({ courses: filtered });
  response.headers.set("Cache-Control", "private, max-age=120");
  return response;
}
