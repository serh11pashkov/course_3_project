"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { GraduationCap, LayoutDashboard, Plus } from "lucide-react";

type AppSidebarProps = {
  role: "student" | "teacher" | null | undefined;
  courses: Array<{ id: string; title: string }>;
  dashboardHref: string;
  currentCourseId?: string;
  loadingCourses?: boolean;
};

export function AppSidebar({
  role,
  courses,
  dashboardHref,
  currentCourseId,
  loadingCourses = false,
}: AppSidebarProps) {
  const getInitials = (title: string) =>
    title
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader className="h-20 flex flex-row items-center px-6 border-b">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 self-center shrink-0"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-lg text-primary">
            EduGrade
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={dashboardHref} className="w-full">
                <SidebarMenuButton
                  className="hover:bg-muted h-12 transition-all"
                  isActive={false}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-base font-medium">Головна</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <SidebarGroupLabel className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Мої курси
            </SidebarGroupLabel>
            {role === "student" ? (
              <Link href="/courses/available" title="Записатися на курс">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            ) : null}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {loadingCourses ? (
                <div className="text-xs text-muted-foreground px-2">
                  Завантаження...
                </div>
              ) : courses.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2">
                  Немає курсів
                </div>
              ) : (
                courses.map((course) => {
                  const isActive = currentCourseId === course.id;
                  return (
                    <SidebarMenuItem key={course.id}>
                      <Link href={`/courses/${course.id}`} className="w-full">
                        <SidebarMenuButton
                          tooltip={course.title}
                          className={
                            isActive
                              ? "bg-primary/5 text-primary font-bold border-l-4 border-primary rounded-none py-6"
                              : "hover:bg-muted py-6"
                          }
                        >
                          <div
                            className={
                              isActive
                                ? "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20"
                                : "w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/10"
                            }
                          >
                            {getInitials(course.title)}
                          </div>
                          <span className="truncate font-medium">
                            {course.title}
                          </span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
