
export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
}

export interface RubricCriterion {
  name: string;
  maxScore: number;
  description: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  rubric: {
    criteria: RubricCriterion[];
    totalPoints: number;
  };
  dueDate: string;
  createdAt: string;
}

export type SubmissionStatus = "submitted" | "grading" | "graded";

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
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
}
