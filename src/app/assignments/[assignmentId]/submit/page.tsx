"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileUpload } from "@/components/assignment/FileUpload";
import { StatusBadge } from "@/components/assignment/StatusBadge";
import {
  ArrowLeft,
  Info,
  BrainCircuit,
  FileText,
  CalendarDays,
} from "lucide-react";

function formatFileType(fileName?: string, mime?: string) {
  // Prefer extension from fileName
  try {
    if (fileName) {
      const parts = fileName.split(".");
      if (parts.length > 1) {
        return parts.pop()?.toLowerCase() || "Файл";
      }
    }
  } catch {}

  // Fallback to common mime -> extension mapping
  if (mime) {
    const map: Record<string, string> = {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/msword": "doc",
      "application/pdf": "pdf",
      "text/plain": "txt",
      "application/zip": "zip",
    };
    const normalized = mime.toLowerCase();
    let ext = map[normalized] || normalized.split("/").pop() || "Файл";
    if (ext && !ext.startsWith(".")) ext = `.${ext}`;
    return ext;
  }

  return "Файл";
}
import {
  createSubmission,
  attachUploadAndGrade,
  getSubmission,
  retrySubmissionGrading,
  getMySubmissionForAssignment,
  returnSubmission,
} from "@/app/actions/grading";
import { useToast } from "@/hooks/use-toast";
import { UserNav } from "@/components/layout/UserNav";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function SubmitAssignmentPage() {
  const { assignmentId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [submission, setSubmission] = useState<any | null>(null);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [teacherSubmissions, setTeacherSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const role = (session?.user as any)?.role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const isTeacher = role === "teacher";
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

  useEffect(() => {
    (async () => {
      try {
        setLoadingAssignment(true);
        const response = await fetch(`/api/assignments/${assignmentId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          setAssignment(null);
          return;
        }
        const json = await response.json();
        setAssignment(json.assignment ?? null);
      } catch {
        setAssignment(null);
      } finally {
        setLoadingAssignment(false);
      }
    })();
  }, [assignmentId]);

  useEffect(() => {
    if (!isTeacher) return;

    (async () => {
      try {
        const response = await fetch(
          `/api/assignments/${assignmentId}/submissions`,
          {
            cache: "no-store",
          },
        );
        if (!response.ok) {
          setTeacherSubmissions([]);
          return;
        }
        const json = await response.json();
        setTeacherSubmissions(json.submissions ?? []);
      } catch {
        setTeacherSubmissions([]);
      }
    })();
  }, [assignmentId, isTeacher]);

  useEffect(() => {
    if (role !== "student") return;

    (async () => {
      try {
        const existing = await getMySubmissionForAssignment(
          assignmentId as string,
        );
        if (existing) setSubmission(existing);
      } catch {
        // no-op: this fetch is best-effort for UI state restore
      }
    })();
  }, [assignmentId, role]);

  // Poll for grading status if currently grading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submission?.status === "grading") {
      setIsGrading(true);
      interval = setInterval(async () => {
        const updated = await getSubmission(submission.id);
        if (updated && updated.status === "graded") {
          setSubmission(updated);
          setIsGrading(false);
          clearInterval(interval);
          toast({
            title: "Оцінювання завершено",
            description: "Ваше завдання перевірено ШІ.",
          });
          // Redirect to results after a short delay
          setTimeout(() => router.push(`/submissions/${submission.id}`), 1500);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [submission?.status, submission?.id, toast, router]);

  const uploadToBackend = (
    submissionId: string,
    file: File,
    onProgress: (p: number) => void,
  ): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/submissions/${submissionId}/upload`, true);
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        onProgress((evt.loaded / evt.total) * 100);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText || "{}");
            const fileUrl =
              (parsed?.fileUrl as string | undefined) ??
              (parsed?.readUrl as string | undefined);
            if (!fileUrl) {
              reject(new Error("Сервер не повернув посилання на файл."));
              return;
            }
            resolve(fileUrl);
          } catch {
            reject(
              new Error("Некоректна відповідь сервера під час завантаження."),
            );
          }
          return;
        }

        try {
          const parsed = JSON.parse(xhr.responseText || "{}");
          reject(
            new Error(parsed?.error || `Помилка завантаження (${xhr.status})`),
          );
        } catch {
          reject(new Error(`Помилка завантаження (${xhr.status})`));
        }
      };
      xhr.onerror = () =>
        reject(new Error("Мережева помилка під час завантаження."));

      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  };

  const handleUpload = async (file: File, onProgress: (p: number) => void) => {
    try {
      const newSub = await createSubmission(assignmentId as string, {
        fileName: file.name,
        fileType: file.type,
      });
      setSubmission(newSub as any);

      const readUrl = await uploadToBackend(newSub.id, file, onProgress);

      toast({
        title: "Файл завантажено",
        description: "Запускаємо перевірку ШІ...",
      });

      const updatingSub = await attachUploadAndGrade(newSub.id, readUrl);
      if (updatingSub) setSubmission(updatingSub);
      if ((updatingSub as any)?.gradingError) {
        toast({
          variant: "destructive",
          title: "Перевірка ШІ недоступна",
          description: (updatingSub as any).gradingError,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не вдалося надіслати файл. Спробуйте ще раз.";
      toast({
        variant: "destructive",
        title: "Помилка подачі",
        description: message,
      });
      throw new Error(message);
    }
  };

  const handleRetryAi = async () => {
    if (!submission?.id) return;
    setRetrying(true);
    try {
      const updated = await retrySubmissionGrading(submission.id);
      if (updated) setSubmission(updated);
      if ((updated as any)?.gradingError) {
        toast({
          variant: "destructive",
          title: "Перевірка ШІ недоступна",
          description: (updated as any).gradingError,
        });
      } else {
        toast({
          title: "Повторну перевірку запущено",
          description: "ШІ повторно аналізує вашу роботу.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description:
          error instanceof Error
            ? error.message
            : "Не вдалося повторно запустити перевірку.",
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleReturnSubmission = async () => {
    if (!submission?.id) return;
    try {
      const updated = await returnSubmission(submission.id);
      setSubmission(updated);
      toast({
        title: "Роботу повернуто",
        description: "Оцінку скинуто. Тепер можна завантажити новий файл.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description:
          error instanceof Error
            ? error.message
            : "Не вдалося повернути роботу.",
      });
    }
  };

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

          <div className="p-8 max-w-4xl mx-auto space-y-8">
            <Link
              href={`/courses`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад до курсу
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-headline font-bold">
                    {assignment?.title ?? "Подати завдання"}
                  </h1>
                  {loadingAssignment ? (
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      Завантажуємо умови завдання...
                    </p>
                  ) : assignment ? (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                        {assignment.description}
                      </p>
                      {assignment?.dueDate ? (
                        <p className="text-sm text-muted-foreground">
                          Дедлайн:{" "}
                          {new Date(assignment.dueDate).toLocaleString("uk-UA")}
                        </p>
                      ) : null}
                      {/** Download link for teacher-provided attachment (if any) */}
                      {assignment?.attachmentFileName ||
                      assignment?.attachmentText ? (
                        <p className="mt-2">
                          <a
                            href={`/api/assignments/${assignmentId}/file`}
                            className="text-sm text-primary font-medium hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Завантажити прикріплений файл:{" "}
                            {assignment.attachmentFileName ||
                              `${assignment.title || "assignment"}.txt`}
                          </a>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-destructive text-sm">
                      Не вдалося завантажити деталі завдання.
                    </p>
                  )}
                </div>

                <Card className="overflow-hidden border-2">
                  <CardHeader className="bg-primary/5 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-headline">
                        {isTeacher ? "Надіслані роботи" : "Надіслати роботу"}
                      </CardTitle>
                      {submission && <StatusBadge status={submission.status} />}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {submission?.status === "graded" ? (
                      <div className="text-center py-12 space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                          <CheckCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-headline font-bold">
                            Оцінювання завершено
                          </h3>
                          <p className="text-muted-foreground">
                            Переходимо до результатів...
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Link href={`/submissions/${submission.id}`}>
                            <Button size="lg" className="rounded-full px-8">
                              Переглянути результат
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleReturnSubmission}
                          >
                            Повернути роботу
                          </Button>
                        </div>
                      </div>
                    ) : submission?.status === "grading" ? (
                      <div className="text-center py-12 space-y-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
                          <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
                          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-headline font-bold text-primary">
                            ШІ виконує перевірку
                          </h3>
                          <p className="text-muted-foreground">
                            Зазвичай це займає 15-30 секунд.
                          </p>
                        </div>
                      </div>
                    ) : isTeacher ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Ви в режимі викладача. Оберіть подану роботу для
                          ручного оцінювання або корекції оцінки після ШІ.
                        </p>
                        {teacherSubmissions.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                            Поки немає поданих робіт для цього завдання.
                          </div>
                        ) : (
                          <div className="space-y-4 py-1">
                            {teacherSubmissions.map((item) => (
                              <Link
                                key={item.id}
                                href={`/submissions/${item.id}`}
                                className="block"
                              >
                                <Card className="hover:bg-muted/30 transition-colors">
                                  <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-medium truncate">
                                          {item.fileName}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase">
                                          {formatFileType(
                                            item.fileName,
                                            item.fileType,
                                          )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Від: {item.studentName ?? "Студент"}
                                        </p>
                                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                          <CalendarDays className="w-3.5 h-3.5" />
                                          {new Date(
                                            item.submittedAt,
                                          ).toLocaleString("uk-UA")}
                                        </p>
                                      </div>
                                    </div>
                                    <StatusBadge status={item.status} />
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : assignment ? (
                      submission?.fileUrl ? (
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg space-y-1">
                            <p>
                              Файл вже завантажено:{" "}
                              <span className="font-medium text-foreground">
                                {submission.fileName}
                              </span>
                            </p>
                            <p>
                              Щоб завантажити інший файл, спочатку натисніть
                              "Повернути роботу".
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {submission.status !== "graded" ? (
                              <Button
                                onClick={handleRetryAi}
                                disabled={retrying}
                              >
                                {retrying
                                  ? "Запускаємо..."
                                  : "Повторити перевірку ШІ"}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleReturnSubmission}
                            >
                              Повернути роботу
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <FileUpload onUpload={handleUpload} />
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                        Наразі неможливо подати роботу, бо завдання не
                        завантажилося.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Критерії оцінювання
                    </CardTitle>
                    <CardDescription>
                      {loadingAssignment
                        ? "Завантажуємо критерії..."
                        : assignment?.rubric?.criteria?.length
                          ? "Оцінювання виконується за критеріями нижче."
                          : "Критерії для цього завдання не задані викладачем."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingAssignment ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        Завантаження...
                      </div>
                    ) : assignment?.rubric?.criteria?.length ? (
                      <div className="divide-y">
                        {assignment.rubric.criteria.map(
                          (criterion: any, index: number) => (
                            <div
                              key={`${criterion.name}-${index}`}
                              className="p-4 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">
                                  {criterion.name}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {criterion.maxScore} балів
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {criterion.description}
                              </p>
                            </div>
                          ),
                        )}
                        <div className="p-4 text-sm font-semibold flex items-center justify-between bg-muted/30">
                          <span>Максимум</span>
                          <span>{assignment.rubric.totalPoints} балів</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">—</div>
                    )}
                  </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    ШІ використовує ці критерії, щоб дати швидкий і зрозумілий
                    зворотний зв'язок.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
