"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Users,
  BookOpen,
  Plus,
  LayoutDashboard,
  FileCheck,
  GraduationCap,
  LogOut,
  Settings,
  Inbox,
  Clock,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
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

export default function TeacherDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentGrowthPercent: 0,
    pendingReviews: 0,
    averageAIScore: 0,
    upcomingDeadlines: [] as Array<{
      assignmentId: string;
      title: string;
      dueDate: string;
      courseTitle: string;
      submissionsCount: number;
    }>,
  });
  const { data: session } = useSession();
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        setLoading(true);
        const [coursesRes, subsRes, statsRes] = await Promise.all([
          fetch("/api/courses/my").then((r) => r.json()),
          fetch("/api/submissions/recent").then((r) => r.json()),
          fetch("/api/teacher/dashboard-stats").then((r) => r.json()),
        ]);
        setCourses(coursesRes.courses ?? []);
        setSubmissions(subsRes.submissions ?? []);
        if (!statsRes.error) {
          setStats(statsRes);
        }
      } catch {
        setCourses([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pendingSubmissions = submissions.filter(
    (s) =>
      s.status === "submitted" || (s.status === "graded" && !s.teacherComment),
  );

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="h-16 flex flex-row items-center px-6 border-b">
            <Link
              href="/teacher/dashboard"
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
                  <Link href="/teacher/dashboard" className="w-full">
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
              <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase text-muted-foreground mb-3">
                Мої курси
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {courses.map((course: any) => {
                    const coverUrl = getCourseCoverUrl(course);
                    return (
                      <SidebarMenuItem key={course.id}>
                        <Link href={`/courses/${course.id}`} className="w-full">
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
                  })}
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
              Панель викладача
            </h2>
            <UserNav />
          </header>

          {/* Content */}
          <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Greeting Section with Actions */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-bold text-foreground">
                  Вітаємо, {session?.user?.name?.split(" ")[0] ?? "викладач"}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Керуйте вашими курсами та перевіряйте роботи студентів
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link href="/teacher/assignments/new">
                  <Button
                    variant="outline"
                    className="gap-2 border-primary text-primary hover:bg-primary/10 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Нове завдання
                  </Button>
                </Link>
                <Link href="/teacher/courses/new">
                  <Button className="gap-2 bg-primary hover:bg-primary/90 rounded-lg">
                    <Plus className="w-4 h-4" />
                    Новий курс
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Students */}
              <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100">
                  <CardTitle className="text-sm font-medium">
                    Студентів всього
                  </CardTitle>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-5">
                  <div className="text-3xl font-bold">
                    {stats.totalStudents}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {stats.studentGrowthPercent}%
                    </span>
                    {" цього місяця"}
                  </p>
                </CardContent>
              </Card>

              {/* Pending Reviews */}
              <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100">
                  <CardTitle className="text-sm font-medium">
                    Очікують перевірки
                  </CardTitle>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-5">
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.pendingReviews}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Роботи, що потребують вашої уваги
                  </p>
                </CardContent>
              </Card>

              {/* Average AI Score */}
              <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100">
                  <CardTitle className="text-sm font-medium">
                    Середній бал ШІ
                  </CardTitle>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-5">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(stats.averageAIScore)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    По всіх завданнях
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            {stats.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-2xl font-headline font-bold">
                    Найближчі дедлайни
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Важливі терміни на наступні 2 тижні
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.upcomingDeadlines.map((deadline) => {
                    const dueDate = new Date(deadline.dueDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.ceil(
                      (dueDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const isUrgent = daysUntil <= 3;

                    return (
                      <Card
                        key={deadline.assignmentId}
                        className={`border border-gray-200 shadow-md hover:shadow-lg transition-all ${
                          isUrgent ? "bg-red-50" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <p className="font-semibold text-sm line-clamp-2">
                                {deadline.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {deadline.courseTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {deadline.submissionsCount} студент(ів) подали
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p
                                className={`text-lg font-bold ${
                                  isUrgent ? "text-red-600" : "text-blue-600"
                                }`}
                              >
                                {daysUntil}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                днів залишилось
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recent Submissions */}
            <section className="space-y-5">
              <div>
                <h2 className="text-2xl font-headline font-bold">
                  Останні роботи студентів
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Нещодавно подані завдання
                </p>
              </div>
              {submissions.length === 0 ? (
                <Card className="border-2 border-dashed py-16">
                  <CardContent className="text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Студенти ще не подали жодної роботи
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {submissions
                    .slice()
                    .reverse()
                    .map((sub) => (
                      <Link href={`/submissions/${sub.id}`} key={sub.id}>
                        <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all hover:bg-blue-50/50 group">
                          <CardContent className="py-5 px-6 flex items-center justify-between gap-5 border-b border-gray-200">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                <FileCheck className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                  {sub.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Від: {sub.studentName ?? "Студент"} •{" "}
                                  {new Date(sub.submittedAt).toLocaleDateString(
                                    "uk-UA",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <span className="text-sm font-bold text-primary leading-none">
                                  {sub.finalScore ??
                                    sub.aiGrade?.totalScore ??
                                    "—"}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  балів
                                </span>
                              </div>
                              <StatusBadge status={sub.status} />
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              )}
            </section>

            {/* Your Courses */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-headline font-bold">
                    Ваші курси
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loading
                      ? "Завантаження..."
                      : `${courses.length} активних курс(ів)`}
                  </p>
                </div>
                <Link href="/teacher/courses/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Створити
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Card
                      key={i}
                      className="overflow-hidden border-0 shadow-sm animate-pulse"
                    >
                      <div className="h-32 bg-gradient-to-br from-muted to-muted/50" />
                      <CardContent className="p-5 space-y-3">
                        <div className="h-4 w-2/3 bg-muted rounded" />
                        <div className="h-3 w-full bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <Card className="border-2 border-dashed py-16">
                  <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Inbox className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">
                        Ви ще не створили курсів
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Натисніть кнопку вище, щоб створити новий курс
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => {
                    const coverUrl = getCourseCoverUrl(course);
                    return (
                      <Card
                        key={course.id}
                        className="hover:shadow-2xl transition-all overflow-hidden border border-gray-200 shadow-md hover:scale-105 transform"
                      >
                        {/* Course Color Header */}
                        <div
                          className="h-32 relative overflow-hidden bg-cover bg-center"
                          style={{ backgroundImage: `url(${coverUrl})` }}
                        />

                        {/* Course Info */}
                        <CardHeader className="pb-3 pt-5 border-b border-gray-100">
                          <CardTitle className="text-lg">
                            {course.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-5">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description || "Описание курса"}
                          </p>
                          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">
                              {course.assignmentsCount ?? 0} завдань
                            </span>
                            <Link href={`/courses/${course.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary hover:bg-primary/10 font-medium text-sm"
                              >
                                Керувати
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
