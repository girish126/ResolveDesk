
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
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <MessageSquareWarning size={22} />
            </span>
            <span>
              <span className="block text-lg font-bold text-slate-900">
                ResolveDesk
              </span>
              <span className="text-xs text-slate-500">
                Complaint Management
              </span>
            </span>
          </Link>

          {onClose && (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="px-4 pt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="mt-3 space-y-1">
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {user?.name
                ?.split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "RD"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name ?? "ResolveDesk"}
              </p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
