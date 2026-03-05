import { NextResponse } from "next/server";
import { requireSession } from "@/lib/db/server";
import {
  listStudentEnrolledCourses,
  listTeacherCourses,
} from "@/lib/db/server";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const session = await requireSession();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as
    | "student"
    | "teacher"
    | null
    | undefined;

  const courses =
    role === "teacher"
      ? await listTeacherCourses(userId)
      : await listStudentEnrolledCourses(userId);

  const response = NextResponse.json({ courses });
  response.headers.set("Cache-Control", "private, max-age=60");
  return response;
}
