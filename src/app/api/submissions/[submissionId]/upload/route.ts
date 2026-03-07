import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import type { DbSubmission } from "@/lib/db/types";

// Firestore document limit is 1 MiB. Leave ~100 KB for overhead/metadata.
const MAX_FILE_SIZE = 900 * 1024;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as
    | "student"
    | "teacher"
    | null
    | undefined;
  if (role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as any).id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 401 });
  }

  const { submissionId } = await params;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Файл занадто великий (макс. 900 КБ)." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const submissionRef = db.collection("submissions").doc(submissionId);
  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const submission = submissionDoc.data() as DbSubmission;
  if (submission.studentId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType =
      file.type || submission.fileType || "application/octet-stream";

    // Store binary data in a separate Firestore collection (no Firebase Storage needed)
    await db.collection("submission_files").doc(submissionId).set({
      data: bytes,
      mimeType,
      fileName: file.name,
    });

    const fileUrl = `/api/files/${submissionId}`;

    await submissionRef.set(
      {
        fileUrl,
        fileName: file.name,
        fileType: mimeType,
        storagePath: "",
      },
      { merge: true },
    );

    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error("Submission upload failed", { submissionId, error });
    return NextResponse.json(
      { error: "Не вдалося зберегти файл." },
      { status: 500 },
    );
  }
}
