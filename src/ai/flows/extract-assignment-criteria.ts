"use server";
/**
 * @fileOverview Extract grading criteria from assignment description text using AI
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ExtractCriteriaInputSchema = z.object({
  assignmentDescription: z
    .string()
    .describe("The full text of the assignment description or requirements."),
});

export type ExtractCriteriaInput = z.infer<typeof ExtractCriteriaInputSchema>;

const CriterionSchema = z.object({
  name: z.string().describe("The name of the grading criterion."),
  maxScore: z
    .number()
    .describe("The suggested maximum score for this criterion (e.g., 25, 50)."),
  description: z
    .string()
    .describe("A detailed description of what is expected for this criterion."),
});

const ExtractCriteriaOutputSchema = z.object({
  criteria: z
    .array(CriterionSchema)
    .describe(
      "An array of suggested grading criteria extracted from the assignment.",
    ),
  totalPoints: z.number().describe("The sum of all suggested maximum scores."),
  summary: z
    .string()
    .describe("A brief summary of the assignment requirements."),
});

export type ExtractCriteriaOutput = z.infer<typeof ExtractCriteriaOutputSchema>;

export async function extractAssignmentCriteria(
  input: ExtractCriteriaInput,
): Promise<ExtractCriteriaOutput> {
  return extractAssignmentCriteriaFlow(input);
}

const extractCriteriaPrompt = ai.definePrompt({
  name: "extractCriteriaPrompt",
  input: { schema: ExtractCriteriaInputSchema },
  output: { schema: ExtractCriteriaOutputSchema },
  prompt: `You are an educational assessment expert. Analyze the following assignment description and extract clear, measurable grading criteria.

IMPORTANT: Return all text in Ukrainian language.

Assignment Description:
\`\`\`
{{{assignmentDescription}}}
\`\`\`

Based on the assignment description:
1. Identify 4-6 key learning objectives or requirements that can be graded
2. For each criterion, assign a reasonable maximum score (typically 15-25 points each)
3. Ensure the total points sum to 100 or a reasonable total
4. Provide clear descriptions of what constitutes full marks for each criterion

Return criteria that are:
- Specific and measurable
- Aligned with the assignment goals
- Achievable within the scope of the task
- Clear enough for both students and graders to understand

If the description is vague or lacks clear requirements, infer reasonable criteria based on common academic standards.`,
});

const extractAssignmentCriteriaFlow = ai.defineFlow(
  {
    name: "extractAssignmentCriteriaFlow",
    inputSchema: ExtractCriteriaInputSchema,
    outputSchema: ExtractCriteriaOutputSchema,
  },
  async (input) => {
    const { output } = await extractCriteriaPrompt(input);
    return output!;
  },
);
