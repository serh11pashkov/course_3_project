import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireRole } from "@/lib/db/server";

interface AssignmentDeadline {
  assignmentId: string;
  title: string;
  dueDate: string;
  courseTitle: string;
  submissionsCount: number;
}

interface DashboardStats {
  totalStudents: number;
  studentGrowthPercent: number;
  pendingReviews: number;
  averageAIScore: number;
  upcomingDeadlines: AssignmentDeadline[];
}

export async function GET(
  req: Request,
): Promise<NextResponse<DashboardStats | { error: string }>> {
  try {
    const user = await requireRole("teacher");
    const db = getAdminDb();
    const teacherId = (user.user as any).id as string | undefined;

    if (!teacherId) {
      return NextResponse.json({
        totalStudents: 0,
        studentGrowthPercent: 0,
        pendingReviews: 0,
        averageAIScore: 0,
        upcomingDeadlines: [],
      });
    }

    // Get teacher's courses
    const coursesSnapshot = await db
      .collection("courses")
      .where("teacherId", "==", teacherId)
      .get();

    const courseIds = coursesSnapshot.docs
      .map((doc) => doc.id)
      .filter(Boolean) as string[];
    const courseMap = new Map(
      coursesSnapshot.docs.map((doc) => [doc.id, doc.data().title]),
    );

    if (courseIds.length === 0) {
      return NextResponse.json({
        totalStudents: 0,
        studentGrowthPercent: 0,
        pendingReviews: 0,
        averageAIScore: 0,
        upcomingDeadlines: [],
      });
    }

    // Get unique enrolled students (chunk 'in' queries)
    const chunks: string[][] = [];
    for (let i = 0; i < courseIds.length; i += 10) {
      chunks.push(courseIds.slice(i, i + 10));
    }

    const enrollmentDocs = (
      await Promise.all(
        chunks.map((chunk) =>
          db.collection("enrollments").where("courseId", "in", chunk).get(),
        ),
      )
    ).flatMap((snap) => snap.docs);

    const uniqueStudents = new Set(
      enrollmentDocs.map((doc) => doc.data().studentId),
    );
    const totalStudents = uniqueStudents.size;

    // Get submissions for all courses (chunked)
    const submissionDocs = (
      await Promise.all(
        chunks.map((chunk) =>
          db.collection("submissions").where("courseId", "in", chunk).get(),
        ),
      )
    ).flatMap((snap) => snap.docs);

    // Calculate pending reviews
    const pendingReviews = submissionDocs.filter((doc) => {
      const data = doc.data();
      return (
        data.status === "submitted" ||
        (data.status === "graded" && !data.teacherComment)
      );
    }).length;

    // Calculate average AI score
    const aiScores = submissionDocs
      .map((doc) => doc.data().aiGrade?.totalScore)
      .filter((score): score is number => typeof score === "number");

    const averageAIScore =
      aiScores.length > 0
        ? Math.round(
            (aiScores.reduce((a, b) => a + b, 0) / aiScores.length) * 100,
          ) / 100
        : 0;

    // Calculate growth percent (compare with last month)
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    // Last month enrollments (chunked, filtered in memory to avoid composite index requirements)
    const lastMonthEnrollDocs = (
      await Promise.all(
        chunks.map((chunk) =>
          db.collection("enrollments").where("courseId", "in", chunk).get(),
        ),
      )
    )
      .flatMap((snap) => snap.docs)
      .filter((doc) => {
        const data = doc.data();
        const enrolledAt = data.enrolledAt;
        const enrolledDate = new Date(enrolledAt || 0);
        return enrolledDate <= lastMonth;
      });

    const lastMonthStudents = new Set(
      lastMonthEnrollDocs.map((doc) => doc.data().studentId),
    );
    const lastMonthCount = lastMonthStudents.size;

    const studentGrowthPercent =
      lastMonthCount > 0
        ? Math.round(((totalStudents - lastMonthCount) / lastMonthCount) * 100)
        : 0;

    // Get upcoming deadlines
    // Assignments (chunked)
    const assignmentDocs = (
      await Promise.all(
        chunks.map((chunk) =>
          db.collection("assignments").where("courseId", "in", chunk).get(),
        ),
      )
    ).flatMap((snap) => snap.docs);

    const upcomingDeadlines: AssignmentDeadline[] = [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (const assignmentDoc of assignmentDocs) {
      const assignmentData = assignmentDoc.data();
      const dueDate = new Date(assignmentData.dueDate || 0);

      // Show deadlines for next 14 days
      if (
        dueDate > todayDate &&
        dueDate.getTime() - todayDate.getTime() <= 14 * 24 * 60 * 60 * 1000
      ) {
        const submissionCount = submissionDocs.filter(
          (doc) => doc.data().assignmentId === assignmentDoc.id,
        ).length;

        upcomingDeadlines.push({
          assignmentId: assignmentDoc.id,
          title: assignmentData.title || "Без назви",
          dueDate: dueDate.toISOString().split("T")[0],
          courseTitle:
            courseMap.get(assignmentData.courseId) || "Невідомий курс",
          submissionsCount: submissionCount,
        });
      }
    }

    // Sort by due date
    upcomingDeadlines.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    return NextResponse.json({
      totalStudents,
      studentGrowthPercent,
      pendingReviews,
      averageAIScore,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5), // Top 5 deadlines
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch stats",
      },
      { status: 500 },
    );
  }
}
