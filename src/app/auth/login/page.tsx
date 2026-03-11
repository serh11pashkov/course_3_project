"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleCredentialsLogin = async (formData: FormData) => {
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      callbackUrl: "/dashboard",
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError("Невірний email або пароль.");
      return;
    }

    setRedirecting(true);

    // Read session after successful sign-in and route by role.
    const updatedSession = await getSession();
    const role = (updatedSession?.user as any)?.role as
      | "student"
      | "teacher"
      | null
      | undefined;
    window.location.href =
      role === "teacher" ? "/teacher/dashboard" : "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        На головну
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary">
            EduGrade AI
          </h1>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Вхід</CardTitle>
            <CardDescription>Увійдіть через email і пароль</CardDescription>
          </CardHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleCredentialsLogin(new FormData(e.currentTarget));
            }}
          >
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error ? (
                <p className="w-full text-sm text-destructive">{error}</p>
              ) : null}
              <Button
                type="submit"
                disabled={submitting || redirecting}
                className="w-full h-11 text-lg rounded-xl"
              >
                {redirecting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Переходимо до головної...
                  </span>
                ) : submitting ? (
                  "Входимо..."
                ) : (
                  "Увійти"
                )}
              </Button>
              {redirecting ? (
                <p className="w-full text-sm text-muted-foreground text-center">
                  Аутентифікація успішна, відкриваємо дашборд...
                </p>
              ) : null}
              <p className="text-sm text-center text-muted-foreground">
                Ще не маєте акаунта?{" "}
                <Link
                  href="/auth/register"
                  className="text-primary font-semibold hover:underline"
                >
                  Створити акаунт
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
