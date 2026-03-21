"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (
    file: File,
    onProgress: (percent: number) => void,
  ) => Promise<void>;
  acceptedExtensions?: string[];
}

export function FileUpload({
  onUpload,
  acceptedExtensions = [
    ".pdf",
    ".docx",
    ".txt",
    ".js",
    ".ts",
    ".py",
    ".png",
    ".jpg",
  ],
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (selectedFile: File) => {
    setError(null);
    const ext = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();
    if (!acceptedExtensions.includes(ext)) {
      setError("Непідтримуваний тип файлу");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Файл занадто великий (максимум 10 МБ)");
      return;
    }
    setFile(selectedFile);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      setProgress(0);
      await onUpload(file, (p) =>
        setProgress(Math.max(0, Math.min(100, Math.round(p)))),
      );
      setProgress(100);
      setUploading(false);
    } catch (error: any) {
      setError(error?.message || "Помилка під час надсилання файлу");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer flex flex-col items-center gap-4",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-headline font-semibold text-lg">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, Word, TXT, or Code files (max 10MB)
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            className="hidden"
            onChange={onFileChange}
            accept={acceptedExtensions.join(",")}
          />
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFile(null);
                  setError(null);
                  setProgress(0);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {uploading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Надсилання файлу...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : progress === 100 ? (
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
              <CheckCircle className="w-4 h-4" />
              Файл завантажено. Запущено перевірку...
            </div>
          ) : (
            <Button className="w-full" onClick={handleUpload}>
              Надіслати завдання
            </Button>
          )}

          {error ? (
            <p className="text-sm text-destructive mt-3">{error}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
