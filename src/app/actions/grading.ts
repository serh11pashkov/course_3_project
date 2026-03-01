"use server";

import { gradeAssignmentSubmission } from "@/ai/flows/grade-assignment-submission";
import { getAdminDb } from "@/lib/firebase/admin";
import { getUserById } from "@/lib/firebase/users";
import { FieldValue } from "firebase-admin/firestore";
import {
  getStudentEnrollment,
  requireRole,
  requireSession,
} from "@/lib/db/server";
import type { DbSubmission } from "@/lib/db/types";
import { toBufferFromFirestoreBytes } from "@/lib/db/bytes";
import { extractTextFromBuffer } from "@/lib/grading/extract-text";

export async function createSubmission(
  assignmentId: string,
  fileMeta: { fileName: string; fileType: string },
) {
  const session = await requireRole("student");
  const studentId = (session.user as any).id as string;

  const db = getAdminDb();
  const assignmentDoc = await db
    .collection("assignments")
    .doc(assignmentId)
    .get();
  if (!assignmentDoc.exists) throw new Error("Assignment not found");
  const assignment = assignmentDoc.data() as any;

  const enrollment = await getStudentEnrollment(studentId, assignment.courseId);
  if (!enrollment || enrollment.status !== "active") {
    throw new Error("Ви не записані на цей курс.");
  }

  const existingSnap = await db
    .collection("submissions")
    .where("assignmentId", "==", assignmentId)
    .where("studentId", "==", studentId)
    .limit(50)
    .get();

  const existing = existingSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DbSubmission, "id">) }))
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];

  const ref = existing
    ? db.collection("submissions").doc(existing.id)
    : db.collection("submissions").doc();
  const storagePath = `submissions/${ref.id}/${fileMeta.fileName}`;

  const submission: Omit<DbSubmission, "id"> = {
    assignmentId,
    courseId: assignment.courseId,
    studentId,
    fileUrl: "",
    fileName: fileMeta.fileName,
    fileType: fileMeta.fileType || "",
    storagePath,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  };

  await ref.set(
    {
      ...submission,
      aiGrade: FieldValue.delete(),
      feedback: FieldValue.delete(),
      finalScore: FieldValue.delete(),
      teacherComment: FieldValue.delete(),
      gradedAt: FieldValue.delete(),
    },
    { merge: true },
  );
  return { id: ref.id, ...submission };
}

export async function getMySubmissionForAssignment(assignmentId: string) {
  const session = await requireRole("student");
  const studentId = (session.user as any).id as string;

  const db = getAdminDb();
  const snap = await db
    .collection("submissions")
    .where("assignmentId", "==", assignmentId)
    .where("studentId", "==", studentId)
    .limit(50)
    .get();

  if (snap.empty) return null;

  const latest = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DbSubmission, "id">) }))
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];

  return latest;
}

export async function getSubmission(submissionId: string) {
  await requireSession();
  const db = getAdminDb();
  const doc = await db.collection("submissions").doc(submissionId).get();
  if (!doc.exists) return null;
  const submission = {
    id: doc.id,
    ...(doc.data() as Omit<DbSubmission, "id">),
  };
  const student = await getUserById(submission.studentId);
  return {
    ...submission,
    studentName: student?.name?.trim() || student?.email?.trim() || "Студент",
  };
}

export async function getSubmissionUploadUrl(
  submissionId: string,
  fileType: string,
) {
  const session = await requireRole("student");
  const studentId = (session.user as any).id as string;

  const db = getAdminDb();
  const submissionRef = db.collection("submissions").doc(submissionId);
  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) throw new Error("Submission not found");
  const submission = submissionDoc.data() as DbSubmission;
  if (submission.studentId !== studentId) throw new Error("Forbidden");

  // Legacy API kept for compatibility; direct upload now goes through
  // /api/submissions/[submissionId]/upload and file download via /api/files/[submissionId]
  return {
    uploadUrl: "",
    readUrl: `/api/files/${submissionId}`,
    storagePath: submission.storagePath,
    fileType,
  };
}

export async function attachUploadAndGrade(
  submissionId: string,
  fileUrl: string,
) {
  const session = await requireRole("student");
  const studentId = (session.user as any).id as string;

  const db = getAdminDb();
  const submissionRef = db.collection("submissions").doc(submissionId);
  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) throw new Error("Submission not found");
  const submission = submissionDoc.data() as DbSubmission;
  if (submission.studentId !== studentId) throw new Error("Forbidden");

  await submissionRef.set({ fileUrl, status: "grading" }, { merge: true });

  const assignmentDoc = await db
    .collection("assignments")
    .doc(submission.assignmentId)
    .get();
  if (!assignmentDoc.exists) throw new Error("Assignment not found");
  const assignment = assignmentDoc.data() as any;

  try {
    const fileDoc = await db
      .collection("submission_files")
      .doc(submissionId)
      .get();
    if (!fileDoc.exists) {
      throw new Error("Submission file not found");
    }

    const filePayload = fileDoc.data() as { data: unknown };
    const buf = toBufferFromFirestoreBytes(filePayload.data);
    const submissionContent = await extractTextFromBuffer({
      buffer: buf,
      fileName: submission.fileName,
      fileType: submission.fileType,
    });

    const result = await gradeAssignmentSubmission({
      submissionContent,
      assignmentDescription: assignment.description,
      rubric: assignment.rubric,
    });

    await submissionRef.set(
      {
        status: "graded",
        gradedAt: new Date().toISOString(),
        finalScore: result.totalScore,
        aiGrade: {
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          breakdown: result.breakdown,
          explanation: result.explanation,
        },
        feedback: result.feedback,
      },
      { merge: true },
    );

    const updated = await submissionRef.get();
    return { id: updated.id, ...(updated.data() as Omit<DbSubmission, "id">) };
  } catch (error) {
    await submissionRef.set({ status: "submitted" }, { merge: true });
    const message =
      error instanceof Error &&
      /api key not valid|invalid_argument|generativelanguage\.googleapis\.com/i.test(
        error.message,
      )
        ? "ШІ-перевірка тимчасово недоступна. Файл збережено, спробуйте пізніше."
        : "ШІ-перевірка не вдалась. Файл збережено, спробуйте ще раз.";

    const updated = await submissionRef.get();
    return {
      id: updated.id,
      ...(updated.data() as Omit<DbSubmission, "id">),
      gradingError: message,
    };
  }
}

export async function retrySubmissionGrading(submissionId: string) {
  const session = await requireRole("student");
  const studentId = (session.user as any).id as string;

  const db = getAdminDb();
  const submissionRef = db.collection("submissions").doc(submissionId);
  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) throw new Error("Submission not found");

  const submission = submissionDoc.data() as DbSubmission;
  if (submission.studentId !== studentId) throw new Error("Forbidden");
  if (!submission.fileUrl) {
    throw new Error(
      "Файл для перевірки не знайдено. Завантажте роботу повторно.",
    );
  }

  await submissionRef.set({ status: "grading" }, { merge: true });

  const assignmentDoc = await db
    .collection("assignments")
    .doc(submission.assignmentId)
    .get();
  if (!assignmentDoc.exists) throw new Error("Assignment not found");
  const assignment = assignmentDoc.data() as any;

  try {
    const fileDoc = await db
      .collection("submission_files")
      .doc(submissionId)
      .get();
    if (!fileDoc.exists) {
      throw new Error("Submission file not found");
    }

    const filePayload = fileDoc.data() as { data: unknown };
    const buf = toBufferFromFirestoreBytes(filePayload.data);
    const submissionContent = await extractTextFromBuffer({
      buffer: buf,
      fileName: submission.fileName,
      fileType: submission.fileType,
    });

    const result = await gradeAssignmentSubmission({
      submissionContent,
      assignmentDescription: assignment.description,
      rubric: assignment.rubric,
    });

    await submissionRef.set(
      {
        status: "graded",
        gradedAt: new Date().toISOString(),
        finalScore: result.totalScore,
        aiGrade: {
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          breakdown: result.breakdown,
          explanation: result.explanation,
        },
        feedback: result.feedback,
      },
      { merge: true },
    );

    const updated = await submissionRef.get();
    return { id: updated.id, ...(updated.data() as Omit<DbSubmission, "id">) };
  } catch (error) {
    await submissionRef.set({ status: "submitted" }, { merge: true });
    const message =
      error instanceof Error &&
      /api key not valid|invalid_argument|generativelanguage\.googleapis\.com/i.test(
        error.message,
      )
        ? "ШІ-перевірка тимчасово недоступна. Спробуйте пізніше."
        : "Не вдалося повторно запустити перевірку ШІ.";

    const updated = await submissionRef.get();
    return {
      id: updated.id,
      ...(updated.data() as Omit<DbSubmission, "id">),
      gradingError: message,
    };
  }
}

export async function returnSubmission(submissionId: string) {
  const session = await requireRole("student");
  const studentId = (session.user as any).id as string;

  const db = getAdminDb();
  const submissionRef = db.collection("submissions").doc(submissionId);
  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) throw new Error("Submission not found");

  const submission = submissionDoc.data() as DbSubmission;
  if (submission.studentId !== studentId) throw new Error("Forbidden");

  await submissionRef.set(
    {
      fileUrl: "",
      fileName: "",
      fileType: "",
      status: "submitted",
      aiGrade: FieldValue.delete(),
      feedback: FieldValue.delete(),
      finalScore: FieldValue.delete(),
      teacherComment: FieldValue.delete(),
      gradedAt: FieldValue.delete(),
    },
    { merge: true },
  );

  await db.collection("submission_files").doc(submissionId).delete();

  const updated = await submissionRef.get();
  return { id: updated.id, ...(updated.data() as Omit<DbSubmission, "id">) };
}
