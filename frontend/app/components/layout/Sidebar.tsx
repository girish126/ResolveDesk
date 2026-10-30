
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  Wrench,
  BarChart3,
  MessageSquareWarning,
  X,
  Plus,
  LogOut,
  Package,
} from "lucide-react";
import useDemoSession from "@/app/hooks/useDemoSession";
import { authService } from "@/app/services/auth.service";
import { clearDemoSession } from "@/app/lib/demo-store";

const adminNavigation = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "All Tickets", href: "/dashboard/admin/tickets", icon: Ticket },
  { label: "Spare Part Requests", href: "/dashboard/admin/spare-parts", icon: Package },
  { label: "Engineers", href: "/dashboard/engineers", icon: Wrench },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const engineerNavigation = [
  { label: "Assigned Tickets", href: "/dashboard/engineers/tickets", icon: Ticket },
  { label: "Spare Parts", href: "/dashboard/engineers/spare-parts", icon: Package },
];

const userNavigation = [
  { label: "My Complaints", href: "/dashboard/user", icon: LayoutDashboard },
  { label: "Raise a Ticket", href: "/dashboard/user/new", icon: Plus },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  open = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useDemoSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigation = user?.role === "ADMIN"
    ? adminNavigation
    : user?.role === "USER"
      ? userNavigation
      : user?.role === "ENGINEER" || user?.role === "EMPLOYEE"
        ? engineerNavigation
        : [];
  const roleLabel =
    user?.role === "ENGINEER"
      ? "Engineer"
      : user?.role === "ADMIN"
        ? "Administrator"
        : user?.role === "USER"
          ? "User"
          : "Sign in required";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authService.logout();
    } finally {
      clearDemoSession();
      router.replace("/auth/login");
      setLoggingOut(false);
    }
  }

  return (
    <>
      {open && onClose && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/40">
              <MessageSquareWarning size={21} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-white">
                ResolveDesk
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                Complaint Management
              </span>
            </span>
          </Link>

          {onClose && (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="px-3 pt-7">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>

          <nav aria-label="Workspace navigation" className="mt-3 space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard/admin" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    active
                      ? "bg-blue-500 text-white shadow-md shadow-blue-950/30"
                      : "text-slate-400 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={active ? "text-white" : "text-slate-500 transition group-hover:text-blue-300"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-400/15 font-semibold text-blue-200 ring-1 ring-blue-300/20">
              {user?.name
                ?.split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "RD"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name ?? "ResolveDesk"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
          >
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
