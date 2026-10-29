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
    return <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Checking your account access…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            Workspace / Dashboard /{" "}
            <span className="font-medium text-slate-800">{pageTitle}</span>
          </p>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
