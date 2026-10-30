"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import TicketStatusBadge from "@/app/components/tickets/TicketStatusBadge";
import TicketAttachments from "@/app/components/tickets/TicketAttachments";
import { adminService, type AdminEngineer } from "@/app/services/admin.service";
import type { Ticket } from "@/app/types/ticket";

export default function AdminTicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [engineers, setEngineers] = useState<AdminEngineer[]>([]);
  const [engineerId, setEngineerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([adminService.getTickets(), adminService.getEngineers()])
      .then(([tickets, nextEngineers]) => {
        if (!active) return;
        setTicket(tickets.find((item) => item.id === id) ?? null);
        setEngineers(nextEngineers);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load ticket."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function assign() {
    if (!ticket || !engineerId) return;
    setSaving(true);
    try {
      setTicket(await adminService.assignTicket(ticket.id, engineerId));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to assign ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8" aria-label="Loading ticket">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
        <Link href="/dashboard/admin/tickets" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
          <ArrowLeft size={17} /> Back to tickets
        </Link>
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
        <Link href="/dashboard/admin/tickets" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
          <ArrowLeft size={17} /> Back to tickets
        </Link>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Ticket not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <Link href="/dashboard/admin/tickets" className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <ArrowLeft size={17} /> Back to ticket queue
      </Link>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-linear-to-br from-white via-blue-50/60 to-slate-50 p-5 sm:p-8">
          <div className="min-w-0">
            <p className="break-all text-[11px] font-bold uppercase tracking-wide text-blue-700">{ticket.ticketNo ?? ticket.id}</p>
            <h1 className="mt-2 wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{ticket.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{ticket.category} <span className="mx-1 text-slate-300">•</span> {ticket.priority} priority</p>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </header>

        <div className="space-y-6 p-5 sm:space-y-8 sm:p-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Complaint details</h2>
            <p className="mt-3 whitespace-pre-wrap wrap-break-word rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 sm:p-5">{ticket.description}</p>
          </div>

          {ticket.complaintImages && ticket.complaintImages.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Images submitted by the user</h2>
              <TicketAttachments attachments={ticket.complaintImages} label="Images submitted by the user" />
            </div>
          )}

          {ticket.responses && ticket.responses.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
              <h2 className="font-semibold text-emerald-950">Engineer response</h2>
              {ticket.responses.map((response) => (
                <div key={response.id} className="border-t border-emerald-200 pt-3">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-emerald-800">
                    <span className="font-semibold">{response.authorName}</span>
                    <span>{response.createdAt}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-emerald-950">{response.message}</p>
                  {response.attachments && response.attachments.length > 0 && (
                    <TicketAttachments attachments={response.attachments} label="Images submitted by the engineer" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            {[
              { label: "Requester", value: ticket.requester, detail: ticket.requesterEmail },
              { label: "Created", value: ticket.createdAt },
              { label: "Category", value: ticket.category },
              { label: "Priority", value: ticket.priority },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="mt-1.5 wrap-break-word text-sm font-semibold text-slate-900">{item.value}</p>
                {item.detail && <p className="mt-0.5 break-all text-xs text-slate-500">{item.detail}</p>}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
            <label htmlFor="ticket-engineer" className="text-sm font-semibold text-slate-900">Assigned engineer</label>
            <p className="mt-1 text-xs leading-5 text-slate-500">Choose an engineer to take ownership of this complaint.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                id="ticket-engineer"
                aria-label="Assign ticket to engineer"
                value={engineerId || ticket.assignedEngineerId || ""}
                onChange={(event) => setEngineerId(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
              >
                <option value="">{ticket.assignedEngineer || "Choose engineer"}</option>
                {engineers.map((engineer) => <option key={engineer.id} value={engineer.id}>{engineer.name}</option>)}
              </select>
              <button
                type="button"
                disabled={saving || !engineerId}
                onClick={() => void assign()}
                className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Assigning…" : "Save assignment"}
              </button>
            </div>
            {ticket.assignedEngineer && <p className="mt-2 text-xs text-slate-600">Currently assigned to {ticket.assignedEngineer}.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
