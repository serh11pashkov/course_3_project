import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/db/server';
import { listCourses } from '@/lib/db/server';

export async function GET() {
  await requireSession();
  const courses = await listCourses();
  return NextResponse.json({ courses });
}

