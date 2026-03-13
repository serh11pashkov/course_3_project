"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  GraduationCap,
  FileText,
  Calendar,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  Settings,
  LogOut,
  Loader2,
  Pencil,
  Trash2,
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

export default function CoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [course, setCourse] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isCourseEditing, setIsCourseEditing] = useState(false);
  const [courseDraft, setCourseDraft] = useState({
    title: "",
    description: "",
  });

  const role = (session?.user as any)?.role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const isTeacher = role === "teacher";
  const dashboardHref = isTeacher ? "/teacher/dashboard" : "/dashboard";

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
        const id = String(courseId);
        const [coursesRes, courseRes, assignmentsRes] =
          await Promise.allSettled([
            fetchJsonSafe("/api/courses/my"),
            fetchJsonSafe(`/api/courses/${id}`),
            fetchJsonSafe(`/api/courses/${id}/assignments`),
          ]);

        const coursesJson =
          coursesRes.status === "fulfilled" ? coursesRes.value : null;
        const courseJson =
          courseRes.status === "fulfilled" ? courseRes.value : null;
        const assignmentsJson =
          assignmentsRes.status === "fulfilled" ? assignmentsRes.value : null;

        setCourses(coursesJson?.courses ?? []);
        setCourse(courseJson?.course ?? null);
        setAssignments(assignmentsJson?.assignments ?? []);
      } catch {
        setCourses([]);
        setCourse(null);
        setAssignments([]);
      } finally {
        // Delay hiding loading to prevent flash on fast networks
        setTimeout(() => setLoading(false), 300);
      }
    })();
  }, [courseId, isTeacher]);

  const getInitials = (title: string) => {
    return title
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    if (!course) return;
    setCourseDraft({
      title: course.title ?? "",
      description: course.description ?? "",
    });
  }, [course]);

  const saveCourse = async () => {
    if (!course || !isTeacher) return;
    const title = courseDraft.title.trim();
    const description = courseDraft.description.trim();

    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Назва й опис курсу не можуть бути порожніми.",
      });
      return;
    }

    setProcessing("course-edit");
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error(await res.text());

      setCourse((prev: any) => ({ ...prev, title, description }));
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, title, description } : c,
        ),
      );
      setIsCourseEditing(false);
      toast({ title: "Курс оновлено" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description:
          error instanceof Error ? error.message : "Не вдалося оновити курс.",
      });
    } finally {
      setProcessing(null);
    }
  };

  const deleteCourse = async () => {
    if (!course || !isTeacher) return;
    const confirmed = window.confirm(
      "Видалити курс і всі його завдання? Цю дію неможливо скасувати.",
    );
    if (!confirmed) return;

    setProcessing("course-delete");
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());

      toast({ title: "Курс видалено" });
      router.push("/teacher/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description:
          error instanceof Error ? error.message : "Не вдалося видалити курс.",
      });
    } finally {
      setProcessing(null);
    }
  };

  const deleteAssignment = async (assignment: any) => {
    if (!isTeacher) return;
    const confirmed = window.confirm("Видалити це завдання?");
    if (!confirmed) return;

    setProcessing(`assignment-delete-${assignment.id}`);
    try {
      const res = await fetch(`/api/teacher/assignments/${assignment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());

      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
      toast({ title: "Завдання видалено" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description:
          error instanceof Error
            ? error.message
            : "Не вдалося видалити завдання.",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!mounted) return null;
  if (!loading && !course)
    return <div className="p-20 text-center">Курс не знайдено</div>;

  const courseTitle = course?.title ?? "Завантаження курсу...";
  const courseDescription = course?.description ?? "Завантажуємо опис курсу...";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="h-20 flex flex-row items-center px-6 border-b">
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 self-center shrink-0"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-headline font-bold text-lg text-primary">
                EduGrade
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href={dashboardHref} className="w-full">
                    <SidebarMenuButton className="hover:bg-muted h-12 transition-all">
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="text-base font-medium">Головна</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                Мої курси
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {courses.map((c) => (
                    <SidebarMenuItem key={c.id}>
                      <Link href={`/courses/${c.id}`} className="w-full">
                        <SidebarMenuButton
                          isActive={c.id === courseId}
                          tooltip={c.title}
                          className={`py-6 ${c.id === courseId ? "bg-primary/5 text-primary font-bold border-l-4 border-primary rounded-none" : "hover:bg-muted"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${c.id === courseId ? "bg-primary/10 border-primary/20 text-primary" : "bg-primary/5 border-primary/10 text-primary"}`}
                          >
                            {getInitials(c.title)}
                          </div>
                          <span className="truncate">{c.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto border-t pt-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/profile" className="w-full">
                    <SidebarMenuButton className="py-5">
                      <Settings className="w-4 h-4" />
                      <span>Налаштування</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="button"
                    onClick={handleSignOut}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 py-5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Вийти</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <h2 className="font-headline font-bold text-xl">{courseTitle}</h2>
              {isTeacher ? (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Режим викладача
                </span>
              ) : null}
            </div>
            <UserNav />
          </header>

          <div className="p-8 max-w-5xl mx-auto space-y-8">
            {!loading && isTeacher ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setCourseDraft({
                      title: course.title ?? "",
                      description: course.description ?? "",
                    });
                    setIsCourseEditing((prev) => !prev);
                  }}
                  disabled={processing !== null}
                >
                  {processing === "course-edit" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                  {isCourseEditing ? "Сховати редактор" : "Редагувати курс"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={deleteCourse}
                  disabled={processing !== null}
                >
                  {processing === "course-delete" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Видалити курс
                </Button>
                <Link
                  href={`/teacher/assignments/new?courseId=${course?.id ?? courseId}`}
                >
                  <Button type="button">Додати нове завдання</Button>
                </Link>
              </div>
            ) : null}

            {isTeacher && isCourseEditing ? (
              <Card className="border-2 border-primary/30">
                <CardHeader>
                  <CardTitle>Редагування курсу</CardTitle>
                  <CardDescription>
                    Оновіть назву та опис курсу і натисніть "Зберегти".
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Назва курсу</label>
                    <Input
                      value={courseDraft.title}
                      onChange={(e) =>
                        setCourseDraft((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Введіть назву курсу"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Опис курсу</label>
                    <Textarea
                      value={courseDraft.description}
                      onChange={(e) =>
                        setCourseDraft((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Введіть короткий опис курсу"
                      className="min-h-[140px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsCourseEditing(false)}
                      disabled={processing !== null}
                    >
                      Скасувати
                    </Button>
                    <Button
                      type="button"
                      onClick={saveCourse}
                      disabled={processing !== null}
                      className="gap-2"
                    >
                      {processing === "course-edit" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pencil className="w-4 h-4" />
                      )}
                      Зберегти
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-4">
              <h1 className="text-4xl font-headline font-bold">
                {courseTitle}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {courseDescription}
              </p>
            </div>

            <section className="space-y-6 pt-8">
              <h2 className="text-2xl font-headline font-bold">
                Навчальні завдання
              </h2>

              {loading ? (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      Завантаження курсу...
                    </p>
                  </CardContent>
                </Card>
              ) : assignments.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <Inbox className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-xl">Матеріалів поки нема</p>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Викладач ще не додав жодного завдання для цього курсу.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {assignments.map((assignment) => (
                    <Card
                      key={assignment.id}
                      className="hover:border-primary/50 transition-all hover:shadow-md group border-2"
                    >
                      <CardHeader className="flex flex-row items-center gap-6 space-y-0 p-6">
                        <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <CardTitle className="font-headline text-2xl">
                            {assignment.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                              <Calendar className="w-4 h-4" />
                              Дедлайн:{" "}
                              {new Date(assignment.dueDate).toLocaleDateString(
                                "uk-UA",
                              )}
                            </span>
                            <span className="font-bold text-primary">
                              {assignment.rubric.totalPoints} балів
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/assignments/${assignment.id}/submit`}>
                            <Button className="rounded-full px-6 gap-2">
                              {isTeacher
                                ? "Переглянути результати"
                                : "Переглянути"}
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                          {isTeacher ? (
                            <>
                              <Link
                                href={`/teacher/assignments/new?assignmentId=${assignment.id}`}
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="gap-2"
                                  disabled={processing !== null}
                                >
                                  <Pencil className="w-4 h-4" />
                                  Редагувати
                                </Button>
                              </Link>
                              <Button
                                type="button"
                                variant="destructive"
                                className="gap-2"
                                onClick={() => deleteAssignment(assignment)}
                                disabled={processing !== null}
                              >
                                <Trash2 className="w-4 h-4" />
                                Видалити
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
