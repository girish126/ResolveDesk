"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Ticket } from "lucide-react";
import { adminService } from "@/app/services/admin.service";
import type { AdminSummary } from "@/app/services/admin.service";

type ReportSummary = AdminSummary & { resolutionRate: number };
const emptyReport: ReportSummary = { total: 0, open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0, resolutionRate: 0 };

export default function ReportsPage() {
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminService.getReportSummary()
      .then((data) => { if (active) setReport(data); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load reports."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rows = [
    { label: "Open", count: report.open, color: "bg-blue-500" },
    { label: "Assigned", count: report.assigned, color: "bg-amber-500" },
    { label: "In progress", count: report.inProgress, color: "bg-violet-500" },
    { label: "Resolved", count: report.resolved, color: "bg-emerald-500" },
    { label: "Closed", count: report.closed, color: "bg-slate-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div><p className="text-sm font-medium text-blue-600">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Reports &amp; Analytics</h1><p className="mt-2 text-slate-500">Review complaint volumes and resolution performance.</p></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Total tickets", value: report.total, icon: Ticket },
          { title: "Resolution rate", value: `${report.resolutionRate}%`, icon: CheckCircle2 },
          { title: "In progress", value: report.inProgress, icon: Clock3 },
        ].map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon size={23} className="text-blue-600" /><p className="mt-4 text-sm text-slate-500">{item.title}</p><p className="mt-1 text-3xl font-bold text-slate-900">{loading ? "…" : item.value}</p></article>; })}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3"><BarChart3 className="text-blue-600" size={23} /><div><h2 className="text-lg font-bold text-slate-900">Status breakdown</h2><p className="text-sm text-slate-500">Live ticket totals by status</p></div></div>
        <div className="mt-8 space-y-6">{rows.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">{item.label}</span><span className="text-slate-500">{loading ? "…" : `${item.count} (${report.total ? Math.round((item.count / report.total) * 100) : 0}%)`}</span></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-3 rounded-full ${item.color}`} style={{ width: `${report.total ? (item.count / report.total) * 100 : 0}%` }} /></div></div>)}</div>
      </section>
    </div>
  );
}
