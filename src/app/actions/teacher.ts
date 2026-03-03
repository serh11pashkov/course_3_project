"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireRole, requireSession } from "@/lib/db/server";
import { getCourseCoverUrl } from "@/lib/course-cover";

export async function createCourse(formData: FormData) {
  const session = await requireRole("teacher");
  const teacherId = (session.user as any).id as string;
  const title = formData.get("title")?.toString() || "Новий курс";
  const description = formData.get("description")?.toString() || "";
  const coverImageUrl = getCourseCoverUrl({ title });

  const db = getAdminDb();
  await db.collection("courses").add({
    title,
    description,
    coverImageUrl,
    teacherId,
    createdAt: new Date().toISOString(),
  });
  redirect("/teacher/dashboard");
}

export async function createAssignment(formData: FormData) {
  const session = await requireRole("teacher");
  const teacherId = (session.user as any).id as string;
  const assignmentId = formData.get("assignmentId")?.toString().trim() || "";

  const title = formData.get("title")?.toString() || "Нове завдання";
  const courseId = formData.get("courseId")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const attachmentFileName =
    formData.get("assignmentFileName")?.toString().trim() || "";
  const attachmentText =
    formData.get("assignmentFileText")?.toString() || "";
  const attachmentType =
    formData.get("assignmentFileType")?.toString().trim() || "";
  const dueDate =
    formData.get("dueDate")?.toString() || new Date().toISOString();

  const criteria: { name: string; maxScore: number; description: string }[] =
    [];
  let i = 0;
  while (formData.has(`criterion_name_${i}`)) {
    criteria.push({
      name: formData.get(`criterion_name_${i}`)?.toString() || "",
      maxScore: Number(formData.get(`criterion_score_${i}`)),
      description: formData.get(`criterion_desc_${i}`)?.toString() || "",
    });
    i++;
  }

  // Verify teacher owns the course
  const db = getAdminDb();
  const courseDoc = await db.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) throw new Error("Course not found");
  const course = courseDoc.data() as any;
  if (course.teacherId !== teacherId) throw new Error("Forbidden");

  const payload = {
    courseId,
    title,
    description,
    attachmentFileName,
    attachmentText,
    attachmentType,
    rubric: {
      criteria,
      totalPoints: criteria.reduce(
        (acc, c) => acc + (Number.isFinite(c.maxScore) ? c.maxScore : 0),
        0,
      ),
    },
    dueDate,
  };

  if (assignmentId) {
    const assignmentRef = db.collection("assignments").doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();
    if (!assignmentDoc.exists) throw new Error("Assignment not found");

    const assignment = assignmentDoc.data() as any;
    const currentCourseDoc = await db
      .collection("courses")
      .doc(assignment.courseId)
      .get();
    const currentCourse = currentCourseDoc.data() as any;
    if (!currentCourseDoc.exists || currentCourse.teacherId !== teacherId) {
      throw new Error("Forbidden");
    }

    await assignmentRef.set(
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } else {
    await db.collection("assignments").add({
      ...payload,
      createdAt: new Date().toISOString(),
    });
  }
  redirect("/teacher/dashboard");
}

export async function finalizeGrade(submissionId: string, formData: FormData) {
  await requireSession();
  const finalScore = Number(formData.get("finalScore"));
  const teacherComment = formData.get("teacherComment")?.toString() || "";

  // Collect per-criterion edits if provided
  const breakdown: {
    criterion: string;
    score: number;
    maxScore: number;
    comment: string;
  }[] = [];

  let i = 0;
  while (formData.has(`criterion_score_${i}`)) {
    const name = formData.get(`criterion_name_${i}`)?.toString() || "";
    const score = Number(formData.get(`criterion_score_${i}`));
    const maxScore = Number(formData.get(`criterion_max_${i}`));
    const comment = formData.get(`criterion_comment_${i}`)?.toString() || "";
    breakdown.push({
      criterion: name,
      score: Number.isFinite(score) ? score : 0,
      maxScore: Number.isFinite(maxScore) ? maxScore : 0,
      comment,
    });
    i++;
  }

  const db = getAdminDb();
  const updatePayload: any = {
    finalScore,
    teacherComment,
    status: "graded",
    gradedAt: new Date().toISOString(),
  };

  if (breakdown.length > 0) {
    updatePayload.teacherAdjustments = { breakdown };
  }

  await db
    .collection("submissions")
    .doc(submissionId)
    .set(updatePayload, { merge: true });

  revalidatePath(`/submissions/${submissionId}`);
  return { success: true };
}
