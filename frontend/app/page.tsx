"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { publicDashboardService, type PublicDashboardSummary } from "@/app/services/public-dashboard.service";

export default function Home() {
  const [summary, setSummary] = useState<PublicDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await publicDashboardService.getSummary());
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load live dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSummary);
  }, [loadSummary]);

  const workflow = summary ? [
    { label: "Submitted", count: summary.total, color: "bg-blue-500" },
    { label: "In progress", count: summary.inProgress + summary.assigned, color: "bg-violet-500" },
    { label: "Resolved", count: summary.resolved, color: "bg-emerald-500" },
  ] : [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600"><ClipboardList size={24} /></span>
          <span className="text-xl font-bold">ResolveDesk</span>
        </Link>
        <Link href="/auth/login" className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-800">Sign in</Link>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300"><span className="h-2 w-2 rounded-full bg-blue-400" />Complaint management made simple</div>
          <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Every complaint.<span className="block text-blue-400">One clear solution.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Raise complaints, assign engineers, track progress, and keep everyone informed from one organized workspace.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500">Get started<ArrowRight size={18} /></Link>
            <Link href="/auth/login" className="rounded-xl border border-slate-700 px-6 py-3.5 font-semibold transition hover:bg-slate-800">Sign in to dashboard</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-400" />Track every request</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-400" />Clear accountability</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div><p className="text-sm text-slate-400">Workspace overview</p><h2 className="mt-1 text-xl font-bold">Support dashboard</h2></div>
            <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300">Live data</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-800/80 p-5"><ClipboardList className="text-blue-400" size={23} /><p className="mt-4 text-3xl font-bold">{loading ? "…" : summary?.total ?? "—"}</p><p className="mt-1 text-sm text-slate-400">Total complaints</p></div>
            <div className="rounded-2xl bg-slate-800/80 p-5"><CheckCircle2 className="text-emerald-400" size={23} /><p className="mt-4 text-3xl font-bold">{loading ? "…" : summary?.resolved ?? "—"}</p><p className="mt-1 text-sm text-slate-400">Resolved</p></div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Complaint workflow</h3><Users size={20} className="text-slate-400" /></div>
            {error ? <div className="mt-5 rounded-xl bg-slate-800/80 p-4 text-sm text-slate-300"><p>{error}</p><button type="button" onClick={() => { setLoading(true); void loadSummary(); }} className="mt-3 font-semibold text-blue-300 hover:text-blue-200">Try again</button></div> : workflow.map((item) => {
              const width = summary?.total ? Math.round((item.count / summary.total) * 100) : 0;
              return <div key={item.label} className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">{item.label}</span><span className="text-slate-400">{loading ? "…" : item.count}</span></div><div className="h-2 rounded-full bg-slate-800"><div className={`h-2 rounded-full ${item.color}`} style={{ width: `${width}%` }} /></div></div>;
            })}
            {!loading && !error && summary?.total === 0 && <p className="mt-5 text-sm text-slate-400">No complaints have been submitted yet.</p>}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-500/10 p-4"><ShieldCheck size={24} className="shrink-0 text-blue-400" /><div><p className="text-sm font-semibold">One organized workspace</p><p className="mt-1 text-xs text-slate-400">For users, administrators, and engineers</p></div></div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">ResolveDesk · Complaint Management System</footer>
    </main>
  );
}
