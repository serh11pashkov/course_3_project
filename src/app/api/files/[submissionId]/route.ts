import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { toBufferFromFirestoreBytes } from "@/lib/db/bytes";
import type { DbSubmission } from "@/lib/db/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string | undefined;
  const role = (session.user as any).role as
    | "student"
    | "teacher"
    | null
    | undefined;
  if (!userId || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;
  const db = getAdminDb();

  const submissionDoc = await db
    .collection("submissions")
    .doc(submissionId)
    .get();
  if (!submissionDoc.exists) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const submission = submissionDoc.data() as DbSubmission;

  const isOwner = submission.studentId === userId;
  const isTeacher = role === "teacher";
  if (!isOwner && !isTeacher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileDoc = await db
    .collection("submission_files")
    .doc(submissionId)
    .get();
  if (!fileDoc.exists) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const payload = fileDoc.data() as {
    data: unknown;
    mimeType?: string;
    fileName?: string;
  };

  let bytes: Buffer;
  try {
    bytes = toBufferFromFirestoreBytes(payload.data);
  } catch {
    return NextResponse.json(
      { error: "File bytes are invalid" },
      { status: 500 },
    );
  }

  const fileName = payload.fileName || submission.fileName || "submission.bin";
  const mimeType =
    payload.mimeType || submission.fileType || "application/octet-stream";

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
