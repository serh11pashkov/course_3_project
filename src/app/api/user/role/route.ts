import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setUserRole } from '@/lib/firebase/users';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => null);
  const role = body?.role as 'student' | 'teacher' | undefined;
  if (role !== 'student' && role !== 'teacher') {
    return new NextResponse('Invalid role', { status: 400 });
  }

  const userId = (session.user as any).id as string | undefined;
  if (!userId) return new NextResponse('Missing userId in session', { status: 500 });

  await setUserRole(userId, role);

  return NextResponse.json({ ok: true });
}

