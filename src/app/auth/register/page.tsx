"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (formData: FormData) => {
    setSubmitting(true);
    setError(null);

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "student"),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setSubmitting(false);
      setError(await response.text());
      return;
    }

    const signInResult = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      callbackUrl:
        payload.role === "teacher" ? "/teacher/dashboard" : "/dashboard",
      redirect: false,
    });

    setSubmitting(false);

    if (!signInResult || signInResult.error) {
      setError(
        "Акаунт створено, але автоматичний вхід не вдався. Спробуйте увійти вручну.",
      );
      return;
    }

    window.location.href =
      signInResult.url ??
      (payload.role === "teacher" ? "/teacher/dashboard" : "/dashboard");
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
            <CardTitle className="text-2xl font-headline">
              Створити акаунт
            </CardTitle>
            <CardDescription>
              Створіть акаунт через email і пароль
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleRegister(new FormData(e.currentTarget));
            }}
          >
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ім'я</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Іван"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Прізвище</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Петренко"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-3">
                <Label>Я є:</Label>
                <RadioGroup
                  defaultValue="student"
                  name="role"
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="font-normal">
                      Студент
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="teacher" />
                    <Label htmlFor="teacher" className="font-normal">
                      Викладач
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 text-lg rounded-xl"
              >
                {submitting ? "Створюємо акаунт…" : "Зареєструватися"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Вже маєте акаунт?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary font-semibold hover:underline"
                >
                  Увійти
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
