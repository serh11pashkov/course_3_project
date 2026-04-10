import { auth } from "@/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";
import type {
  DbAssignment,
  DbCourse,
  DbSubmission,
  DbEnrollment,
  UserRole,
} from "@/lib/db/types";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();
  const r = (session.user as any).role as UserRole | null | undefined;
  if (r !== role) throw new Error("Forbidden");
  return session;
}

export async function getCourseById(
  courseId: string,
): Promise<DbCourse | null> {
  const db = getAdminDb();
  const doc = await db.collection("courses").doc(courseId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<DbCourse, "id">) };
}

export async function listCourses(): Promise<DbCourse[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("courses")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<DbCourse, "id">),
  }));
}

export async function listTeacherCourses(
  teacherId: string,
): Promise<DbCourse[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("courses")
    .where("teacherId", "==", teacherId)
    .limit(100)
    .get();
  const courses = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<DbCourse, "id">),
  }));

  // Fetch assignments counts in chunks to avoid many queries
  const courseIds = courses.map((c) => c.id).filter(Boolean) as string[];
  const assignmentCounts = new Map<string, number>();
  if (courseIds.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < courseIds.length; i += 10) {
      chunks.push(courseIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const asnap = await db
        .collection("assignments")
        .where("courseId", "in", chunk)
        .get();

      for (const doc of asnap.docs) {
        const cid = (doc.data() as any).courseId as string;
        assignmentCounts.set(cid, (assignmentCounts.get(cid) ?? 0) + 1);
      }
    }
  }

  return courses
    .map((c) => ({
      ...c,
      assignmentsCount: assignmentCounts.get(c.id) ?? 0,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listStudentEnrolledCourses(
  studentId: string,
): Promise<DbCourse[]> {
  const db = getAdminDb();
  const enrollments = await db
    .collection("enrollments")
    .where("studentId", "==", studentId)
    .limit(300)
    .get();

  const courseIds = enrollments.docs
    .map((d) => d.data() as DbEnrollment)
    .filter((e) => e.status === "active")
    .map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  const deduped = Array.from(new Set(courseIds));
  const chunks: string[][] = [];
  for (let i = 0; i < deduped.length; i += 10) {
    chunks.push(deduped.slice(i, i + 10));
  }

  const docs: DbCourse[] = [];
  for (const chunk of chunks) {
    const courses = await db
      .collection("courses")
      .where(FieldPath.documentId(), "in", chunk)
      .limit(100)
      .get();

    docs.push(
      ...courses.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DbCourse, "id">),
      })),
    );
  }

  return docs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getStudentEnrollment(
  studentId: string,
  courseId: string,
): Promise<DbEnrollment | null> {
  const db = getAdminDb();
  const snap = await db
    .collection("enrollments")
    .where("studentId", "==", studentId)
    .limit(300)
    .get();

  const doc = snap.docs.find(
    (d) => (d.data() as DbEnrollment).courseId === courseId,
  );
  if (!doc) return null;
  return { id: doc.id, ...(doc.data() as Omit<DbEnrollment, "id">) };
}

export async function enrollStudentInCourse(
  studentId: string,
  courseId: string,
): Promise<DbEnrollment> {
  const db = getAdminDb();

  // Check if already enrolled
  const existing = await getStudentEnrollment(studentId, courseId);
  if (existing) return existing;

  // Create enrollment
  const ref = await db.collection("enrollments").add({
    studentId,
    courseId,
    enrolledAt: new Date().toISOString(),
    status: "active",
  });

  return {
    id: ref.id,
    studentId,
    courseId,
    enrolledAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dropCourseEnrollment(
  studentId: string,
  courseId: string,
): Promise<void> {
  const db = getAdminDb();
  const snap = await db
    .collection("enrollments")
    .where("studentId", "==", studentId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get();

  if (!snap.empty) {
    await db
      .collection("enrollments")
      .doc(snap.docs[0].id)
      .update({ status: "dropped" });
  }
}

export async function listAssignmentsByCourse(
  courseId: string,
): Promise<DbAssignment[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("assignments")
    .where("courseId", "==", courseId)
    .limit(200)
    .get();
  return snap.docs
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DbAssignment, "id">),
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getAssignmentById(
  assignmentId: string,
): Promise<DbAssignment | null> {
  const db = getAdminDb();
  const doc = await db.collection("assignments").doc(assignmentId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<DbAssignment, "id">) };
}

export async function getSubmissionById(
  submissionId: string,
): Promise<DbSubmission | null> {
  const db = getAdminDb();
  const doc = await db.collection("submissions").doc(submissionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<DbSubmission, "id">) };
}
