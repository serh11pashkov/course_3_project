"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GraduationCap, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { UserNav } from "@/components/layout/UserNav";
import { useSession } from "next-auth/react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCourseCoverUrl } from "@/lib/course-cover";

export default function CoursesListPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const dashboardHref =
    role === "teacher" ? "/teacher/dashboard" : "/dashboard";
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses/my", { cache: "no-store" });
        const json = await res.json();
        setCourses(json.courses ?? []);
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  const getInitials = (title: string) => {
    return title
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          role={role}
          courses={courses}
          dashboardHref={dashboardHref}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-white">
          <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Назад</span>
            </Link>
            <UserNav />
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-headline font-bold text-foreground">
                Всі ваші курси
              </h1>
              <p className="text-lg text-muted-foreground">
                Оберіть курс для перегляду завдань та навчальних матеріалів
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const coverUrl = getCourseCoverUrl(course);
                return (
                  <Link href={`/courses/${course.id}`} key={course.id}>
                    <Card className="group h-full cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-200 border border-gray-200 shadow-md hover:scale-105 transform">
                      {/* Course Color Header */}
                      <div
                        className="h-32 relative overflow-hidden bg-cover bg-center"
                        style={{ backgroundImage: `url(${coverUrl})` }}
                      />

                      {/* Course Info */}
                      <CardHeader className="pb-3 pt-5 border-b border-gray-100">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-5">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                          {course.description || "Описание курса"}
                        </p>
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">
                            Перейти до курсу
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
