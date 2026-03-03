import { NextResponse } from 'next/server';
import { requireSession, getAssignmentById } from '@/lib/db/server';

export async function GET(_: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  await requireSession();
  const { assignmentId } = await params;
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json({ assignment });
}

