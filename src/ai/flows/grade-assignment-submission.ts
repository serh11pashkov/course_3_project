"use server";
/**
 * @fileOverview This file implements the Genkit flow for automatically grading an assignment submission.
 *
 * - gradeAssignmentSubmission - A function that handles the AI grading process for a student's submission.
 * - GradeAssignmentSubmissionInput - The input type for the gradeAssignmentSubmission function.
 * - GradeAssignmentSubmissionOutput - The return type for the gradeAssignmentSubmission function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const RubricCriterionSchema = z.object({
  name: z.string().describe("The name of the grading criterion."),
  maxScore: z
    .number()
    .describe("The maximum score achievable for this criterion."),
  description: z
    .string()
    .describe("A detailed description of what is expected for this criterion."),
});

const RubricSchema = z.object({
  criteria: z
    .array(RubricCriterionSchema)
    .describe("An array of grading criteria."),
  totalPoints: z
    .number()
    .describe("The total possible points for the assignment."),
});

const GradeAssignmentSubmissionInputSchema = z.object({
  submissionContent: z
    .string()
    .describe(
      "The full content of the student\u0027s submitted file (e.g., text, code, etc.).",
    ),
  assignmentDescription: z
    .string()
    .describe("The description of the assignment."),
  rubric: RubricSchema.describe("The grading rubric for the assignment."),
});
export type GradeAssignmentSubmissionInput = z.infer<
  typeof GradeAssignmentSubmissionInputSchema
>;

const GradeAssignmentSubmissionOutputSchema = z.object({
  totalScore: z.number().describe("The overall score the student received."),
  maxScore: z
    .number()
    .describe("The maximum possible score for the assignment."),
  breakdown: z
    .array(
      z.object({
        criterion: z.string().describe("The name of the criterion."),
        score: z.number().describe("The score received for this criterion."),
        maxScore: z.number().describe("The maximum score for this criterion."),
        comment: z.string().describe("A specific comment for this criterion."),
      }),
    )
    .describe("A detailed breakdown of scores per rubric criterion."),
  explanation: z
    .string()
    .describe("A general explanation of the AI\u0027s grading."),
  feedback: z
    .object({
      strengths: z
        .array(z.string())
        .describe("List of strengths identified in the submission."),
      weaknesses: z
        .array(z.string())
        .describe("List of weaknesses or areas for improvement."),
      recommendations: z
        .array(z.string())
        .describe("Suggestions for improvement."),
      tips: z
        .array(z.string())
        .describe("Additional tips for future assignments."),
    })
    .describe(
      "Detailed feedback categorized into strengths, weaknesses, recommendations, and tips.",
    ),
});
export type GradeAssignmentSubmissionOutput = z.infer<
  typeof GradeAssignmentSubmissionOutputSchema
>;

export async function gradeAssignmentSubmission(
  input: GradeAssignmentSubmissionInput,
): Promise<GradeAssignmentSubmissionOutput> {
  return gradeAssignmentSubmissionFlow(input);
}

const gradeAssignmentSubmissionPrompt = ai.definePrompt({
  name: "gradeAssignmentSubmissionPrompt",
  input: { schema: GradeAssignmentSubmissionInputSchema },
  output: { schema: GradeAssignmentSubmissionOutputSchema },
  prompt: `You are an academic assignment grader. Grade objectively based on the provided rubric.\n\nIMPORTANT: Return all text fields in Ukrainian language (comments, explanation, strengths, weaknesses, recommendations, tips).\n\nAssignment Description:\n{{{assignmentDescription}}}\n\nRubric:\nTotal Possible Points: {{{rubric.totalPoints}}}\n\n{{#each rubric.criteria}}\n- Criterion: {{{name}}} (Max Score: {{{maxScore}}})\n  Description: {{{description}}}\n{{/each}}\n\nStudent Submission Content:\n\u0060\u0060\u0060\n{{{submissionContent}}}\n\u0060\u0060\u0060\n\nBased on the assignment description, the rubric, and the student's submission, provide a comprehensive grade and detailed feedback in the specified JSON format. Ensure that the scores for each criterion are whole numbers and do not exceed the \u0060maxScore\u0060 for that criterion. The \u0060totalScore\u0060 should be the sum of all individual criterion scores.`,
});

const gradeAssignmentSubmissionFlow = ai.defineFlow(
  {
    name: "gradeAssignmentSubmissionFlow",
    inputSchema: GradeAssignmentSubmissionInputSchema,
    outputSchema: GradeAssignmentSubmissionOutputSchema,
  },
  async (input) => {
    const { output } = await gradeAssignmentSubmissionPrompt(input);
    return output!;
  },
);
