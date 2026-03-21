"use client";

import { SubmissionStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "submitted":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "gap-1.5 py-1 px-3 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
            className,
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Submitted
        </Badge>
      );
    case "grading":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "gap-1.5 py-1 px-3 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
            className,
          )}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Grading
        </Badge>
      );
    case "graded":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "gap-1.5 py-1 px-3 bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
            className,
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Graded
        </Badge>
      );
    default:
      return null;
  }
}
