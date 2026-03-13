"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Plus, Loader2 } from "lucide-react";
import { UserNav } from "@/components/layout/UserNav";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCourseCoverUrl } from "@/lib/course-cover";

export default function AvailableCoursesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const dashboardHref =
    role === "teacher" ? "/teacher/dashboard" : "/dashboard";
  const [courses, setCourses] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses/my");
        const json = await res.json();
        setMyCourses(json.courses ?? []);
      } catch {
        setMyCourses([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/courses/available");
        const json = await res.json();
        setCourses(json.courses ?? []);
      } catch (err) {
        console.error("Failed to load courses:", err);
        setCourses([]);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: "Не вдалося завантажити доступні курси",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleEnroll = async (courseId: string) => {
    setEnrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      const res = await fetch("/api/enrollments/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        throw new Error("Failed to enroll");
      }

      // Remove from available courses
      setCourses((prev) => prev.filter((c) => c.id !== courseId));

      toast({
        title: "Успіх",
        description: "Ви записалися на курс",
      });
    } catch (err) {
      console.error("Enrollment error:", err);
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Не вдалося записатися на курс",
      });
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

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
          courses={myCourses}
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
                Записатися на курси
              </h1>
              <p className="text-lg text-muted-foreground">
                Оберіть курс для початку навчання
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Завантаження курсів...
                  </p>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <Card className="border-2 border-dashed py-16">
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      Немає доступних курсів
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ви вже записалися на всі доступні курси
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const coverUrl = getCourseCoverUrl(course);
                  return (
                    <Card
                      key={course.id}
                      className="group h-full overflow-hidden hover:shadow-xl transition-all duration-200 border border-gray-200 shadow-md hover:shadow-2xl hover:scale-105 transform"
                    >
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
                        <div className="pt-2 border-t border-gray-100">
                          <Button
                            className="w-full gap-2"
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrolling[course.id]}
                          >
                            {enrolling[course.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Записування...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Записатися
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
