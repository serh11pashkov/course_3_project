"use client";

import { Submission } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { Brain, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  submission: Submission;
  maxScore?: number;
}

export function ScoreDisplay({ submission, maxScore }: ScoreDisplayProps) {
  const { aiGrade } = submission;
  const displayScore =
    typeof submission.finalScore === "number"
      ? submission.finalScore
      : aiGrade?.totalScore;
  const displayMaxScore =
    maxScore ??
    aiGrade?.maxScore ??
    aiGrade?.breakdown?.reduce((sum, item) => sum + item.maxScore, 0);

  if (typeof displayScore !== "number" || typeof displayMaxScore !== "number") {
    return null;
  }

  const percentage = (displayScore / displayMaxScore) * 100;

  // Determine if score was modified by teacher
  const aiScore = aiGrade?.totalScore;
  const teacherModified =
    typeof submission.finalScore === "number" &&
    aiScore !== undefined &&
    submission.finalScore !== aiScore;
  const scoredByAI = !teacherModified && aiScore !== undefined;

  const getScoreColor = (score: number, max: number) => {
    const p = (score / max) * 100;
    if (p >= 80) return "text-green-600";
    if (p >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const chartData = [
    { name: "Score", value: displayScore },
    { name: "Remaining", value: Math.max(0, displayMaxScore - displayScore) },
  ];

  const chartColor =
    percentage >= 80
      ? "hsl(142, 76%, 36%)"
      : percentage >= 50
        ? "hsl(47, 95%, 48%)"
        : "hsl(0, 84%, 60%)";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Overall Grade
          </CardTitle>
          {scoredByAI && (
            <Badge
              variant="secondary"
              className="gap-1.5 justify-center bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 mt-2"
            >
              <Brain className="w-3.5 h-3.5" />
              Оцінено ШІ
            </Badge>
          )}
          {teacherModified && (
            <div className="mt-2 space-y-2">
              <Badge
                variant="secondary"
                className="gap-1.5 justify-center bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 w-full"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                Змінено викладачем
              </Badge>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  ШІ:{" "}
                  <span className="font-semibold">
                    {aiScore}/{displayMaxScore}
                  </span>
                </p>
                <p>
                  Викладач:{" "}
                  <span className="font-semibold">
                    {displayScore}/{displayMaxScore}
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill={chartColor} />
                  <Cell fill="hsl(var(--muted))" />
                  <Label
                    value={`${Math.round(percentage)}%`}
                    position="center"
                    className="fill-foreground font-headline text-3xl font-bold"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-2xl font-bold font-headline">
              {displayScore}{" "}
              <span className="text-muted-foreground font-normal text-lg">
                / {displayMaxScore}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {aiGrade ? (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Criterion Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiGrade.breakdown.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.criterion}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold tabular-nums",
                        getScoreColor(item.score, item.maxScore),
                      )}
                    >
                      {item.score}/{item.maxScore}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {item.comment}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Оцінку виставлено викладачем
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Деталізація за критеріями недоступна, оскільки оцінка встановлена
              вручну.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
