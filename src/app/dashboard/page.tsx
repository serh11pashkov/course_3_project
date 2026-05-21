"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  Inbox,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/UserNav";
import { StatusBadge } from "@/components/assignment/StatusBadge";
import { getCourseCoverUrl } from "@/lib/course-cover";

export default function StudentDashboard() {
  const [mounted, setMounted] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    setMounted(true);

    const fetchJsonSafe = async (url: string) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return null;

        const text = await response.text();
        if (!text) return null;

        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    (async () => {
      try {
        setLoading(true);
        const [coursesRes, subsRes] = await Promise.allSettled([
          fetchJsonSafe("/api/courses/my"),
          fetchJsonSafe("/api/submissions/recent"),
        ]);

        const coursesJson =
          coursesRes.status === "fulfilled" ? coursesRes.value : null;
        const submissionsJson =
          subsRes.status === "fulfilled" ? subsRes.value : null;

        setCourses(coursesJson?.courses ?? []);
        setRecentSubmissions(submissionsJson?.submissions ?? []);
      } catch (err) {
        console.error("Failed to load courses:", err);
        setCourses([]);
        setRecentSubmissions([]);
      } finally {
        setLoading(false);
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

  if (!mounted) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="h-16 flex flex-row items-center px-6 border-b">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 self-center shrink-0"
            >
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-headline font-bold text-base text-primary">
                EduGrade
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard" className="w-full">
                    <SidebarMenuButton
                      isActive
                      className="bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all rounded-md h-10"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Головна</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <div className="flex items-center justify-between px-2 mb-3">
                <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground">
                  Мої курси
                </SidebarGroupLabel>
                <Link href="/courses/available" title="Записатися на курс">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                  </Button>
                </Link>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading ? (
                    <div className="text-xs text-muted-foreground px-2 py-2">
                      Завантаження...
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-2 py-2">
                      Немає курсів.{" "}
                      <Link
                        href="/courses/available"
                        className="text-primary hover:underline font-medium"
                      >
                        Записатися
                      </Link>
                    </div>
                  ) : (
                    courses.map((course: any) => {
                      const coverUrl = getCourseCoverUrl(course);
                      return (
                        <SidebarMenuItem key={course.id}>
                          <Link
                            href={`/courses/${course.id}`}
                            className="w-full"
                          >
                            <SidebarMenuButton
                              tooltip={course.title}
                              className="hover:bg-muted py-5 rounded-md"
                            >
                              <div
                                className="w-8 h-8 rounded-md shrink-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${coverUrl})` }}
                              />
                              <span className="truncate text-sm font-medium">
                                {course.title}
                              </span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      );
                    })
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto border-t pt-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/profile" className="w-full">
                    <SidebarMenuButton className="py-4 rounded-md hover:bg-muted">
                      <Settings className="w-4 h-4" />
                      <span>Налаштування</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="button"
                    onClick={handleSignOut}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 py-4 rounded-md"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Вийти</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-white">
          {/* Header */}
          <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <h2 className="font-headline font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Студентська панель
            </h2>
            <UserNav />
          </header>

          {/* Content */}
          <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Greeting Section */}
            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-bold text-foreground">
                Вітаємо, {session?.user?.name?.split(" ")[0] ?? "студент"}!
              </h1>
              <p className="text-lg text-muted-foreground">
                Ось що відбувається у ваших курсах
              </p>
            </div>

            {/* Courses Section */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-headline font-bold">
                    Ваші курси
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loading ? "Завантаження..." : `${courses.length} курс(ів)`}
                  </p>
                </div>
                <Link href="/courses">
                  <Button className="gap-2">
                    <span>Переглянути все</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card
                      key={i}
                      className="overflow-hidden animate-pulse border-0 shadow-sm"
                    >
                      <div className="h-32 bg-gradient-to-br from-muted to-muted/50" />
                      <CardContent className="p-5 space-y-3">
                        <div className="h-4 w-2/3 bg-muted rounded" />
                        <div className="h-3 w-full bg-muted rounded" />
                        <div className="h-3 w-4/5 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <Card className="border-2 border-dashed py-16 border-muted">
                  <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Inbox className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">
                        Ви ще не записані на жоден курс
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Натисніть кнопку вище, щоб записатися на новий курс
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, index) => {
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
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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
              )}
            </section>

            {/* Recent Submissions Section */}
            {recentSubmissions.length > 0 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-2xl font-headline font-bold">
                    Останні роботи
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ваші нещодавно подані завдання
                  </p>
                </div>

                <div className="space-y-6">
                  {recentSubmissions.map((sub) => (
                    <Link href={`/submissions/${sub.id}`} key={sub.id}>
                      <Card className="hover:shadow-md transition-all border-0 shadow-sm hover:bg-blue-50/50">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {sub.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(sub.submittedAt).toLocaleDateString(
                                  "uk-UA",
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            {sub.finalScore !== undefined && (
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <span className="text-sm font-bold text-primary">
                                    {sub.finalScore}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground ml-1">
                                    балів
                                  </span>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              </div>
                            )}
                            {!sub.finalScore && sub.status === "submitted" && (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
