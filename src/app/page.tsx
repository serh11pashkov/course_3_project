import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, CheckSquare, BarChart3 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LandingPage() {
  const heroImg = PlaceHolderImages.find((img) => img.id === "hero-education");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 h-20 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 self-center shrink-0"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight text-primary">
            EduGrade AI
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="rounded-full px-8">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-6 container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                Next-Gen Learning Platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-headline font-bold leading-tight">
                AI-Powered <span className="text-primary">Grading</span> for the
                Modern Classroom
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Empower students with instant feedback and teachers with
                automated grading. Our platform uses advanced AI to evaluate
                assignments against custom rubrics.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/login">
                  <Button size="lg" className="rounded-full px-8 h-14 text-lg">
                    Student Login
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 h-14 text-lg"
                  >
                    Teacher Portal
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl -z-10" />
              <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                <Image
                  src={
                    heroImg?.imageUrl ||
                    "https://picsum.photos/seed/edu1/1200/800"
                  }
                  alt="Education"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  data-ai-hint="education student"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white border-y">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-headline font-bold">
                Comprehensive Platform Features
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need for successful distance learning and fair
                evaluation.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Course Management",
                  icon: BookOpen,
                  desc: "Create and enroll in courses with structured assignments and materials.",
                },
                {
                  title: "Instant AI Grading",
                  icon: CheckSquare,
                  desc: "Upload assignments and receive detailed, rubric-based grades in seconds.",
                },
                {
                  title: "Smart Feedback",
                  icon: BarChart3,
                  desc: "Get strengths, weaknesses, and actionable tips to improve learning outcomes.",
                },
              ].map((item, idx) => (
                <Card
                  key={idx}
                  className="border-none shadow-none text-center hover:translate-y-[-4px] transition-transform"
                >
                  <CardContent className="pt-6 space-y-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-headline font-bold">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t bg-slate-50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="inline-flex items-center gap-2 self-center shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <CircleGraduation className="w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-xl text-primary">
              EduGrade AI
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 EduGrade AI. Built for the future of education.
          </p>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="#" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-primary">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CircleGraduation(props: any) {
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
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
