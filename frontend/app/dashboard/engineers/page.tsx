"use client";

import { useEffect, useState } from "react";
import { Users, Wrench } from "lucide-react";
import { adminService, type AdminEngineer } from "@/app/services/admin.service";
import type { Ticket } from "@/app/types/ticket";

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<AdminEngineer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([adminService.getEngineers(), adminService.getTickets()])
      .then(([nextEngineers, nextTickets]) => {
        if (!active) return;
        setEngineers(nextEngineers);
        setTickets(nextTickets);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load engineers.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div><p className="text-sm font-medium text-blue-600">ADMIN WORKSPACE</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Engineers</h1><p className="mt-2 text-slate-500">Review active support engineers and their ticket workloads.</p></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading engineers…</p> : engineers.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No active engineers found.</div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {engineers.map((engineer) => {
            const assigned = tickets.filter((ticket) => ticket.assignedEngineerId === engineer.id && ["Assigned", "In Progress"].includes(ticket.status)).length;
            return <article key={engineer.id} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wrench size={23} /></div><div className="min-w-0"><h2 className="truncate font-bold text-slate-900">{engineer.name}</h2><p className="truncate text-sm text-slate-500">{engineer.email}</p></div></div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><div><p className="text-sm text-slate-500">Active tickets</p><p className="mt-1 text-2xl font-bold text-slate-900">{assigned}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${assigned >= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{assigned >= 5 ? "Busy" : "Available"}</span></div>
            </article>;
          })}
        </div>
      )}
      <p className="flex items-center gap-2 text-xs text-slate-400"><Users size={14} /> Workloads count assigned and in-progress tickets.</p>
    </div>
  );
}
