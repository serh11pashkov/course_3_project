"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function UserNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };
  const name = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const role = (session?.user as any)?.role as
    | "student"
    | "teacher"
    | null
    | undefined;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dashboardHref =
    role === "teacher" ? "/teacher/dashboard" : "/dashboard";
  const isDashboard = pathname === dashboardHref;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border shadow-sm"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={(session?.user as any)?.image ?? ""} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {!isDashboard && (
            <Link href={dashboardHref}>
              <DropdownMenuItem className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Дашборд</span>
              </DropdownMenuItem>
            </Link>
          )}
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Профіль</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center px-2 py-1.5 text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Вийти</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
