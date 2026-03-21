"use client";

import { Submission } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

interface FeedbackPanelProps {
  submission: Submission;
}

export function FeedbackPanel({ submission }: FeedbackPanelProps) {
  const { feedback } = submission;
  if (!feedback) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-headline font-semibold">Детальний відгук</h3>
      <Accordion type="single" collapsible className="w-full space-y-3">
        <AccordionItem
          value="strengths"
          className="border rounded-lg px-4 bg-green-50/30 border-green-100"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">✅ Переваги</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-1 text-green-900/80">
              {feedback.strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="weaknesses"
          className="border rounded-lg px-4 bg-yellow-50/30 border-yellow-100"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900">
                ⚠️ Що покращити
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-1 text-yellow-900/80">
              {feedback.weaknesses.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="recommendations"
          className="border rounded-lg px-4 bg-blue-50/30 border-blue-100"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                💡 Рекомендації
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-1 text-blue-900/80">
              {feedback.recommendations.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="tips"
          className="border rounded-lg px-4 bg-slate-50/30 border-slate-100"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-slate-500" />
              <span className="font-semibold text-slate-700">
                📌 Додаткові поради
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              {feedback.tips.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
