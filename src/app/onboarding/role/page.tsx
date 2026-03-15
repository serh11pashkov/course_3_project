"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

async function saveRole(role: "student" | "teacher") {
  const res = await fetch("/api/user/role", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function RoleOnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState<"student" | "teacher" | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
    const role = (session?.user as any)?.role as string | null | undefined;
    const needsRole = Boolean((session?.user as any)?.needsRole);
    if (status === "authenticated" && !needsRole && role) {
      router.replace(role === "teacher" ? "/teacher/dashboard" : "/dashboard");
    }
  }, [router, session?.user, status]);

  const choose = async (role: "student" | "teacher") => {
    try {
      setSaving(role);
      await saveRole(role);
      await update({ role, needsRole: false });
      toast({
        title: "Роль збережено",
        description: "Переходимо у вашу панель.",
      });
      router.replace(role === "teacher" ? "/teacher/dashboard" : "/dashboard");
      router.refresh();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Не вдалося зберегти роль",
        description: e?.message ?? "Спробуйте ще раз.",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-lg border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            Оберіть вашу роль
          </CardTitle>
          <CardDescription>
            Це потрібно один раз, щоб показувати різний функціонал для студента
            та викладача.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            size="lg"
            className="h-12"
            disabled={Boolean(saving)}
            onClick={() => choose("student")}
          >
            {saving === "student" ? "Зберігаємо…" : "Я студент"}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-12"
            disabled={Boolean(saving)}
            onClick={() => choose("teacher")}
          >
            {saving === "teacher" ? "Зберігаємо…" : "Я викладач"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
