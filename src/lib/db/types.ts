export type UserRole = "student" | "teacher";

export type DbCourse = {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  teacherId: string;
  teacherName?: string;
  createdAt: string;
  assignmentsCount?: number;
};

export type DbEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  status: "active" | "completed" | "dropped";
};

export type DbRubricCriterion = {
  name: string;
  maxScore: number;
  description: string;
};

export type DbAssignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  attachmentFileName?: string;
  attachmentText?: string;
  attachmentType?: string;
  rubric: {
    criteria: DbRubricCriterion[];
    totalPoints: number;
  };
  dueDate: string;
  createdAt: string;
};

export type SubmissionStatus = "submitted" | "grading" | "graded";

export type DbSubmission = {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  status: SubmissionStatus;
  submittedAt: string;
  aiGrade?: {
    totalScore: number;
    maxScore: number;
    breakdown: {
      criterion: string;
      score: number;
      maxScore: number;
      comment: string;
    }[];
    explanation: string;
  };
  feedback?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    tips: string[];
  };
  teacherComment?: string;
  finalScore?: number;
  gradedAt?: string;
};
