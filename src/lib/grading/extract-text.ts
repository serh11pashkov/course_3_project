import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";

export async function extractTextFromBuffer(opts: {
  buffer: Buffer;
  fileName: string;
  fileType: string;
}): Promise<string> {
  const ext = opts.fileName
    .slice(opts.fileName.lastIndexOf(".") + 1)
    .toLowerCase();
  const mime = (opts.fileType || "").toLowerCase();

  // Plain text / code
  if (
    mime.startsWith("text/") ||
    [
      "txt",
      "js",
      "ts",
      "py",
      "java",
      "cpp",
      "c",
      "json",
      "md",
      "html",
      "css",
    ].includes(ext)
  ) {
    return opts.buffer.toString("utf-8");
  }

  if (mime === "application/pdf" || ext === "pdf") {
    const res = await (pdfParse as any)(opts.buffer);
    return res.text || "";
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      const raw = await mammoth.extractRawText({ buffer: opts.buffer });
      const normalizedRaw = (raw.value || "").trim();
      if (normalizedRaw) {
        return normalizedRaw;
      }

      // Fallback for documents where raw extractor returns almost empty output.
      const html = await mammoth.convertToHtml({ buffer: opts.buffer });
      return (html.value || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch (error) {
      throw new Error(
        `Не вдалося зчитати DOCX: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp"].includes(ext)
  ) {
    return `The student submitted an image file (${opts.fileName}). Provide feedback based on what can be inferred. If you cannot read the content, say so and give general recommendations.`;
  }

  return opts.buffer.toString("utf-8");
}
