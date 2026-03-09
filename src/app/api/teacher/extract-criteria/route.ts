import { NextResponse } from "next/server";
import { requireRole } from "@/lib/db/server";
import { extractAssignmentCriteria } from "@/ai/flows/extract-assignment-criteria";

function normalizeSourceText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildFallbackCriteria(sourceText: string) {
  const text = normalizeSourceText(sourceText);
  const hasTechnicalTerms =
    /api|код|алгоритм|інтерфейс|база даних|тест|лог/i.test(text);
  const hasEssayTerms = /есе|реферат|аналіз|поясн|обґрунт/i.test(text);

  return {
    criteria: [
      {
        name: hasTechnicalTerms ? "Функціональність" : "Виконання вимог",
        maxScore: 30,
        description: hasTechnicalTerms
          ? "Рішення працює за призначенням і виконує всі ключові функції завдання."
          : "Робота відповідає основним вимогам завдання та повністю його покриває.",
      },
      {
        name: hasTechnicalTerms ? "Якість реалізації" : "Якість рішення",
        maxScore: 25,
        description: hasTechnicalTerms
          ? "Код або рішення структуровані, зрозумілі та без очевидних помилок."
          : "Рішення структуроване, коректне та демонструє розуміння теми.",
      },
      {
        name: hasEssayTerms ? "Структура та подача" : "Оформлення та подача",
        maxScore: 20,
        description: hasEssayTerms
          ? "Матеріал логічно структурований, читабельний і акуратно оформлений."
          : "Робота оформлена акуратно, зрозуміло та без зайвих помилок.",
      },
      {
        name: hasEssayTerms
          ? "Аргументація"
          : hasTechnicalTerms
            ? "Тестування та надійність"
            : "Самостійність і обґрунтування",
        maxScore: 25,
        description: hasEssayTerms
          ? "Студент або автор чітко пояснює свої висновки й аргументи."
          : hasTechnicalTerms
            ? "Рішення протестоване, стабільне та працює без критичних помилок."
            : "Студент може пояснити свій підхід і обґрунтувати рішення.",
      },
    ],
    totalPoints: 100,
    summary: text
      ? `Автоматично сформовано базовий шаблон критеріїв на основі наданого тексту${text.length > 160 ? "." : `: ${text}`}`
      : "Опис завдання відсутній, тому запропоновано базовий шаблон критеріїв.",
  };
}

export async function POST(req: Request) {
  await requireRole("teacher");

  const body = await req.json().catch(() => null);
  const assignmentTitle =
    typeof body?.assignmentTitle === "string"
      ? body.assignmentTitle.trim()
      : "";
  const assignmentDescription =
    typeof body?.assignmentDescription === "string"
      ? body.assignmentDescription.trim()
      : "";
  const assignmentFileText =
    typeof body?.assignmentFileText === "string"
      ? body.assignmentFileText.trim()
      : "";

  const combinedText = normalizeSourceText(
    [assignmentTitle, assignmentDescription, assignmentFileText]
      .filter(Boolean)
      .join("\n\n"),
  );

  const hasGenAiKey = Boolean(
    process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY,
  );

  try {
    if (!combinedText || !hasGenAiKey) {
      return NextResponse.json(buildFallbackCriteria(combinedText));
    }

    const result = await extractAssignmentCriteria({
      assignmentDescription: combinedText,
    });

    return NextResponse.json({
      criteria: result.criteria,
      totalPoints: result.totalPoints,
      summary: result.summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to extract criteria";
    const isMissingKey = /api key not found|api_key_invalid|invalid api key/i.test(
      message,
    );
    if (!isMissingKey) {
      console.error("Error extracting criteria:", error);
    }
    return NextResponse.json(buildFallbackCriteria(combinedText));
  }
}
