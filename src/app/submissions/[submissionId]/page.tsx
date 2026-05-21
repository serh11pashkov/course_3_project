"use client";

import { useEffect, useState, use } from "react";
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
import { ScoreDisplay } from "@/components/assignment/ScoreDisplay";
import { FeedbackPanel } from "@/components/assignment/FeedbackPanel";
import {
  ArrowLeft,
  Download,
  MessageSquare,
  Brain,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { getSubmission } from "@/app/actions/grading";
import { finalizeGrade } from "@/app/actions/teacher";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { UserNav } from "@/components/layout/UserNav";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function SubmissionDetailsPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = use(params);
  const { toast } = useToast();
  const [submission, setSubmission] = useState<any | null>(null);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function loadData() {
      try {
        const sub = await getSubmission(submissionId);
        if (sub) {
          setSubmission(sub);
          const res = await fetch(`/api/assignments/${sub.assignmentId}`);
          if (res.ok) {
            const json = await res.json();
            setAssignment(json.assignment);
          }
        }
      } catch (error) {
        console.error("Error loading submission:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [submissionId]);

  const isTeacher = (session?.user as any)?.role === "teacher";
  const role = (session?.user as any)?.role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const dashboardHref = isTeacher ? "/teacher/dashboard" : "/dashboard";

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/courses/my", { cache: "no-store" });
        if (!response.ok) {
          setCourses([]);
          return;
        }
        const json = await response.json();
        setCourses(json.courses ?? []);
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  async function handleGradeUpdate(formData: FormData) {
    const res = await finalizeGrade(submissionId, formData);
    if (res.success) {
      toast({
        title: "Оцінку оновлено",
        description: "Ваші зміни успішно збережено.",
      });
      setIsEditing(false);
      // Оновлюємо локальний стан
      const updated = await getSubmission(submissionId);
      if (updated) setSubmission(updated);
    }
  }

  if (loading)
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );

  if (!submission || !assignment)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-headline font-bold">Роботу не знайдено</h1>
        <p className="text-muted-foreground max-w-md">
          Ми не змогли знайти інформацію про цю роботу.
        </p>
        <Link href={isTeacher ? "/teacher/dashboard" : "/dashboard"}>
          <Button>Повернутися на головну</Button>
        </Link>
      </div>
    );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          role={role}
          courses={courses}
          dashboardHref={dashboardHref}
          currentCourseId={assignment?.courseId}
        />

        <main className="flex-1 overflow-y-auto">
          <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
            <div />
            <UserNav />
          </header>

          <div className="p-8 max-w-5xl mx-auto space-y-8">
            <Link
              href={`/courses/${assignment.courseId}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад до курсу
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold">
                  Результати: {assignment.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Хто здав: {submission.studentName ?? "Студент"}
                </p>
                <p className="text-muted-foreground">
                  Подано:{" "}
                  {new Date(submission.submittedAt).toLocaleString("uk-UA")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {submission.fileUrl ? (
                  <Button asChild variant="outline" className="gap-2">
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="w-4 h-4" />
                      {isTeacher
                        ? "Переглянути роботу студента"
                        : "Переглянути мою роботу"}
                    </a>
                  </Button>
                ) : null}
                {isTeacher && !isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full px-6"
                  >
                    Редагувати оцінку
                  </Button>
                )}
                {isTeacher && (
                  <Link
                    href={`/teacher/assignments/new?assignmentId=${assignment.id}`}
                  >
                    <Button variant="outline" className="rounded-full px-4">
                      Редагувати завдання
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <ScoreDisplay
              submission={submission}
              maxScore={assignment?.rubric?.totalPoints}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {isTeacher && isEditing ? (
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle>Редагування оцінки викладачем</CardTitle>
                      <CardDescription>
                        Ви можете змінити фінальний бал та додати коментар для
                        студента.
                      </CardDescription>
                    </CardHeader>
                    <form action={handleGradeUpdate}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="finalScore">
                            Фінальний бал (макс. {assignment.rubric.totalPoints}
                            )
                          </Label>
                          <Input
                            id="finalScore"
                            name="finalScore"
                            type="number"
                            defaultValue={
                              submission.finalScore ??
                              submission.aiGrade?.totalScore ??
                              0
                            }
                            max={assignment.rubric.totalPoints}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacherComment">Ваш коментар</Label>
                          <Textarea
                            id="teacherComment"
                            name="teacherComment"
                            defaultValue={submission.teacherComment}
                            placeholder="Напишіть ваші зауваження або похвалу..."
                            className="min-h-[150px]"
                          />
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold">
                            Оцінки за критеріями
                          </h4>
                          <div className="space-y-3">
                            {(assignment.rubric?.criteria ?? []).map(
                              (c: any, idx: number) => {
                                const aiBreak =
                                  submission.aiGrade?.breakdown?.find(
                                    (b: any) => b.criterion === c.name,
                                  );
                                const teacherBreak =
                                  submission.teacherAdjustments?.breakdown?.find(
                                    (b: any) => b.criterion === c.name,
                                  );
                                return (
                                  <div
                                    key={idx}
                                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_120px_minmax(0,2.4fr)] gap-3 items-start"
                                  >
                                    <input
                                      type="hidden"
                                      name={`criterion_name_${idx}`}
                                      defaultValue={c.name}
                                    />
                                    <input
                                      type="hidden"
                                      name={`criterion_max_${idx}`}
                                      defaultValue={c.maxScore}
                                    />
                                    <div className="min-w-0 pt-7">
                                      <Label className="text-xs break-words leading-5">
                                        {c.name}
                                      </Label>
                                    </div>
                                    <div className="w-full">
                                      <Label className="text-xs">Бал</Label>
                                      <Input
                                        name={`criterion_score_${idx}`}
                                        type="number"
                                        defaultValue={
                                          teacherBreak?.score ??
                                          aiBreak?.score ??
                                          0
                                        }
                                        max={c.maxScore}
                                      />
                                    </div>
                                    <div className="w-full">
                                      <Label className="text-xs">
                                        Коментар
                                      </Label>
                                      <Textarea
                                        name={`criterion_comment_${idx}`}
                                        defaultValue={
                                          teacherBreak?.comment ??
                                          aiBreak?.comment ??
                                          ""
                                        }
                                        className="min-h-[5.5rem] w-full resize-y"
                                      />
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsEditing(false)}
                        >
                          Скасувати
                        </Button>
                        <Button type="submit" className="gap-2">
                          <Save className="w-4 h-4" />
                          Зберегти оцінку
                        </Button>
                      </div>
                    </form>
                  </Card>
                ) : (
                  <>
                    <Card className="border-2 border-primary/10">
                      <CardHeader className="bg-primary/5 border-b">
                        <CardTitle className="flex items-center gap-2 text-primary font-headline">
                          <Brain className="w-5 h-5" />
                          Резюме ШІ-оцінювання
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-lg leading-relaxed text-muted-foreground italic">
                          "{submission.aiGrade?.explanation}"
                        </p>
                      </CardContent>
                    </Card>
                    <FeedbackPanel submission={submission} />
                  </>
                )}
              </div>

              <div className="space-y-6">
                <Card
                  className={
                    submission.teacherComment
                      ? "border-green-200 bg-green-50/10"
                      : ""
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Примітки викладача
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submission.teacherComment ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-white rounded-md shadow-sm">
                          <p className="text-lg text-foreground leading-relaxed whitespace-pre-line">
                            {submission.teacherComment}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Затверджено викладачем
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                        <p className="text-sm">Очікується перевірка.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isTeacher && submission.teacherComment && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 text-white space-y-4 shadow-xl">
                    <h3 className="font-headline font-bold text-xl">
                      Оцінка отримана!
                    </h3>
                    <p className="text-indigo-100 text-sm">
                      Ваш викладач переглянув роботу та залишив фінальний
                      відгук. Ознайомтесь із ним вище.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
