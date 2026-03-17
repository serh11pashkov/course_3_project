"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
import { updateProfile } from "@/app/actions/profile";
import {
  GraduationCap,
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const { data: session, update } = useSession();

  const role = (session?.user as any)?.role as
    | "teacher"
    | "student"
    | null
    | undefined;
  const dashboardHref =
    role === "teacher" ? "/teacher/dashboard" : "/dashboard";

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      const result = await updateProfile(formData);
      if (result?.success) {
        await update({
          name: result.user?.name ?? null,
          email: result.user?.email ?? null,
        });

        toast({
          title: "Профіль оновлено",
          description: "Ваші зміни були успішно збережені.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Помилка оновлення",
        description:
          error instanceof Error ? error.message : "Не вдалося зберегти зміни.",
      });
    } finally {
      setIsPending(false);
    }
  }

  const currentName = session?.user?.name ?? "";
  const currentEmail = session?.user?.email ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 h-20 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 self-center shrink-0"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">
            EduGrade AI
          </span>
        </Link>
      </header>

      <main className="p-8 max-w-2xl mx-auto space-y-8">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до дашборду
        </Link>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">
            Налаштування профілю
          </h1>
          <p className="text-muted-foreground text-lg">
            Керуйте вашою особистою інформацією та обліковим записом.
          </p>
        </div>

        <form action={handleSubmit}>
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Особиста інформація</CardTitle>
              <CardDescription>
                Оновіть ваше ім'я та електронну адресу.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Повне ім'я</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    defaultValue={currentName}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Електронна пошта</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={currentEmail}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <Label>Роль користувача</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="font-medium capitalize">
                    {role ?? "student"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Роль не може бути змінена самостійно. Зверніться до
                  адміністратора.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t p-6 flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Збереження..." : "Зберегти зміни"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
