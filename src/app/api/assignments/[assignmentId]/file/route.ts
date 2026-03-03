import { NextResponse } from "next/server";
import { requireSession, getAssignmentById } from "@/lib/db/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  await requireSession();
  const { assignmentId } = await params;
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    return new NextResponse("Not found", { status: 404 });
  }

  const content = assignment.attachmentText?.trim() || assignment.description?.trim();
  if (!content) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileName =
    assignment.attachmentFileName?.trim() || `${assignment.title || "assignment"}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName.replace(/\"/g, "")}"`,
    },
  });
}
