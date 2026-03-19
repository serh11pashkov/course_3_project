"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, ArrowLeft, Save } from "lucide-react";
import { createCourse } from "@/app/actions/teacher";

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 h-20 flex items-center justify-between border-b bg-white">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 self-center shrink-0"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-2xl text-indigo-600">
            EduGrade
          </span>
        </Link>
      </header>

      <main className="p-8 max-w-3xl mx-auto space-y-8">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до дашборду
        </Link>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">
            Створити новий курс
          </h1>
          <p className="text-muted-foreground text-lg">
            Визначте програму та цілі для нового курсу.
          </p>
        </div>

        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>Дані курсу</CardTitle>
            <CardDescription>
              Заповніть основну інформацію про курс.
            </CardDescription>
          </CardHeader>
          <form action={createCourse}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Назва курсу</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="наприклад: Вступ до квантової фізики"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Опишіть, що студенти вивчатимуть на цьому курсі..."
                  className="min-h-[150px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Категорія</Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="наприклад: Наука"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Рівень складності</Label>
                  <Input id="level" name="level" placeholder="наприклад: Початковий" />
                </div>
              </div>
            </CardContent>
            <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-3">
              <Link href="/teacher/dashboard">
                <Button variant="ghost">Скасувати</Button>
              </Link>
              <Button
                type="submit"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4" />
                Створити курс
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
