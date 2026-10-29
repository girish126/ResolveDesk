
import { Suspense, type ReactNode } from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">
          Loading workspace...
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
