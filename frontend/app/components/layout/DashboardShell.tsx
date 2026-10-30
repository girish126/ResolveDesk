"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import Header from "@/app/components/layout/Header";
import { userService } from "@/app/services/user.service";
import { clearDemoSession, setDemoSession } from "@/app/lib/demo-store";
import { getDashboardPath } from "@/app/lib/auth";
import type { AuthUser, UserRole } from "@/app/types/auth";

function canOpenRoute(role: UserRole, pathname: string) {
  if (pathname === "/dashboard" || pathname === "/dashboard/engineer") return false;

  if (role === "ADMIN") {
    return pathname === "/dashboard/admin" ||
      pathname.startsWith("/dashboard/admin/") ||
      pathname === "/dashboard/engineers" ||
      pathname === "/dashboard/reports";
  }

  if (role === "ENGINEER" || role === "EMPLOYEE") {
    return pathname === "/dashboard/engineers" ||
      pathname.startsWith("/dashboard/engineers/");
  }

  return pathname === "/dashboard/user" ||
    pathname.startsWith("/dashboard/user/");
}

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    userService.getMyProfile()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setDemoSession(currentUser);
      })
      .catch(() => {
        if (!active) return;
        clearDemoSession();
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        router.replace(`/auth/login?redirect=${encodeURIComponent(returnTo)}`);
      })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (checkingSession || !user) return;
    if (!canOpenRoute(user.role, pathname)) {
      router.replace(getDashboardPath(user.role));
    }
  }, [checkingSession, pathname, router, user]);

  const pageTitle =
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Dashboard";

  if (checkingSession || !user || !canOpenRoute(user.role, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
          Checking your account access…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/60 via-slate-50 to-slate-100/70">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="border-b border-slate-200/80 bg-white/70 px-4 py-2.5 sm:px-6 lg:px-8">
          <p className="truncate text-xs text-slate-500 sm:text-sm">
            Workspace / Dashboard /{" "}
            <span className="font-semibold text-slate-800">{pageTitle}</span>
          </p>
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
