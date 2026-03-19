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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createAssignment } from "@/app/actions/teacher";
import { useState } from "react";
import { useEffect } from "react";

export default function NewAssignmentPage() {
  const [criteria, setCriteria] = useState([
    { name: "", maxScore: 0, description: "" },
  ]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isExtractingCriteria, setIsExtractingCriteria] = useState(false);

  const extractTextFromFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === "application/pdf") {
      try {
        const pdf = require("pdf-parse");
        const data = await pdf(arrayBuffer);
        return data.text || "";
      } catch (error) {
        console.error("PDF parsing error:", error);
        return "";
      }
    } else if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      try {
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || "";
      } catch (error) {
        console.error("DOCX parsing error:", error);
        return "";
      }
    } else if (file.type === "text/plain") {
      try {
        return await file.text();
      } catch (error) {
        console.error("Text file reading error:", error);
        return "";
      }
    }

    return "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    setFileName(file.name);

    try {
      const text = await extractTextFromFile(file);
      setFileContent(text);
    } catch (error) {
      console.error("Error processing file:", error);
      setFileContent("");
      setFileName("");
    } finally {
      setIsLoadingFile(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses/my");
        const json = await res.json();
        setCourses(json.courses ?? []);
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preselectedCourseId = params.get("courseId") ?? "";
    if (preselectedCourseId) {
      setSelectedCourseId(preselectedCourseId);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editAssignmentId = params.get("assignmentId") ?? "";
    if (!editAssignmentId) return;

    setAssignmentId(editAssignmentId);
    setIsLoadingAssignment(true);

    (async () => {
      try {
        const res = await fetch(`/api/assignments/${editAssignmentId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const json = await res.json();
        const assignment = json.assignment;
        if (!assignment) return;

        setTitle(assignment.title ?? "");
        setDescription(assignment.description ?? "");
        setDueDate((assignment.dueDate ?? "").split("T")[0] ?? "");
        setSelectedCourseId(assignment.courseId ?? "");

        const nextCriteria = Array.isArray(assignment.rubric?.criteria)
          ? assignment.rubric.criteria.map((c: any) => ({
              name: c.name ?? "",
              maxScore: Number(c.maxScore) || 0,
              description: c.description ?? "",
            }))
          : [];

        setCriteria(
          nextCriteria.length > 0
            ? nextCriteria
            : [{ name: "", maxScore: 0, description: "" }],
        );
      } catch (error) {
        console.error("Error loading assignment for edit:", error);
      } finally {
        setIsLoadingAssignment(false);
      }
    })();
  }, []);

  const addCriterion = () => {
    setCriteria([...criteria, { name: "", maxScore: 0, description: "" }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (
    index: number,
    field: "name" | "maxScore" | "description",
    value: string,
  ) => {
    setCriteria((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "maxScore") {
          return { ...item, maxScore: Number(value) || 0 };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const extractCriteriaWithAI = async () => {
    const titleInput =
      (document.getElementById("title") as HTMLInputElement | null)?.value ??
      "";

    setIsExtractingCriteria(true);
    try {
      const response = await fetch("/api/teacher/extract-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentTitle: titleInput.trim(),
          assignmentDescription: description.trim(),
          assignmentFileText: fileContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract criteria");
      }

      const data = await response.json();
      if (data.criteria && Array.isArray(data.criteria)) {
        setCriteria(
          data.criteria.map((c: any) => ({
            name: c.name || "",
            maxScore: c.maxScore || 0,
            description: c.description || "",
          })),
        );
      }
    } catch (error) {
      console.error("Error extracting criteria:", error);
      alert("Не вдалося витягнути критерії. Спробуйте ще раз.");
    } finally {
      setIsExtractingCriteria(false);
    }
  };

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

      <main className="p-8 max-w-4xl mx-auto space-y-8">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад до дашборду
        </Link>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">
            {assignmentId ? "Редагувати завдання" : "Створити нове завдання"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Опишіть вимоги та критерії для перевірки ШІ.
          </p>
        </div>

        {isLoadingAssignment ? (
          <div className="text-sm text-muted-foreground bg-white border rounded-lg px-4 py-3">
            Завантажуємо завдання для редагування...
          </div>
        ) : null}

        <form action={createAssignment} className="space-y-8">
          {assignmentId ? (
            <input type="hidden" name="assignmentId" value={assignmentId} />
          ) : null}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Опис завдання</CardTitle>
              <CardDescription>
                Вкажіть короткий опис завдання. Якщо треба, завантажте файл
                окремо для аналізу ШІ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Текст завдання</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Що саме мають виконати студенти? Можна лишити поле порожнім, якщо опису ще немає."
                  className="min-h-[180px]"
                />
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="assignmentFile"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  disabled={isLoadingFile}
                  className="hidden"
                />
                <label htmlFor="assignmentFile" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {isLoadingFile
                        ? "Обробка файла..."
                        : fileName ||
                          "Натисніть для завантаження або перетягніть файл"}
                    </p>
                    {fileName && !isLoadingFile && (
                      <p className="text-xs text-green-600">✓ {fileName}</p>
                    )}
                  </div>
                </label>
              </div>

              {fileName && !isLoadingFile ? (
                <div className="flex items-center justify-between rounded-lg border bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <span>Файл додано для аналізу: {fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFileContent("");
                      setFileName("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Інформація про завдання</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Оберіть курс</Label>
                  <input
                    type="hidden"
                    name="courseId"
                    value={selectedCourseId}
                  />
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть курс" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Дедлайн</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Назва завдання</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Наприклад: Лабораторна №3: REST API"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Критерії оцінювання</CardTitle>
                <CardDescription>
                  Додайте критерії, за якими ШІ буде перевіряти роботу.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={extractCriteriaWithAI}
                  disabled={isExtractingCriteria}
                  className="gap-2 bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-100"
                >
                  {isExtractingCriteria ? "Обробка..." : "ШІ витяг критеріїв"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCriterion}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Додати критерій
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {criteria.map((criterion, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-xl space-y-4 bg-slate-50/50"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label>Назва критерію</Label>
                          <Input
                            name={`criterion_name_${index}`}
                            placeholder="Наприклад: Якість коду"
                            value={criterion.name}
                            onChange={(e) =>
                              updateCriterion(index, "name", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Макс. бал</Label>
                          <Input
                            name={`criterion_score_${index}`}
                            type="number"
                            placeholder="25"
                            value={criterion.maxScore}
                            onChange={(e) =>
                              updateCriterion(index, "maxScore", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Опис критерію</Label>
                        <Input
                          name={`criterion_desc_${index}`}
                          placeholder="Що потрібно для максимального балу..."
                          value={criterion.description}
                          onChange={(e) =>
                            updateCriterion(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                    {criteria.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCriterion(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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
                {assignmentId ? "Зберегти зміни" : "Зберегти завдання"}
              </Button>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
