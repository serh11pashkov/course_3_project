import { GraduationCap } from "lucide-react";

export function AppShellLoading() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="w-[280px] border-r bg-white">
        <div className="h-20 flex items-center px-6 border-b">
          <div className="inline-flex items-center gap-2 self-center shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-lg text-primary">
              EduGrade
            </span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-10 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded bg-muted animate-pulse" />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="inline-flex items-center gap-2 self-center shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-2xl text-primary">
              EduGrade
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </header>

        <div className="p-8 max-w-6xl mx-auto space-y-6">
          <div className="h-5 w-48 rounded bg-muted animate-pulse" />
          <div className="h-10 w-72 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-52 rounded-xl border bg-card animate-pulse" />
            <div className="h-52 rounded-xl border bg-card animate-pulse" />
            <div className="h-52 rounded-xl border bg-card animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
