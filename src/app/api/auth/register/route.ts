import { NextResponse } from "next/server";
import { registerUserWithPassword } from "@/lib/firebase/users";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const firstName = typeof body?.firstName === "string" ? body.firstName : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role =
    body?.role === "teacher"
      ? "teacher"
      : body?.role === "student"
        ? "student"
        : null;

  if (!email.trim() || !password.trim() || !role) {
    return new NextResponse("Заповніть усі обовʼязкові поля.", { status: 400 });
  }

  try {
    const user = await registerUserWithPassword({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Не вдалося створити акаунт.",
      { status: 400 },
    );
  }
}
