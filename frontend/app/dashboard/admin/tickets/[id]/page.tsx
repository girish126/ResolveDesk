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

  if (loading) return <p className="mx-auto max-w-4xl p-8 text-sm text-slate-500">Loading ticket…</p>;
  if (error && !ticket) return <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8"><Link href="/dashboard/admin/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={17} /> Back to tickets</Link><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p></div>;
  if (!ticket) return <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8"><Link href="/dashboard/admin/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={17} /> Back to tickets</Link><p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Ticket not found.</p></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/dashboard/admin/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={17} /> Back to tickets</Link>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">{ticket.ticketNo ?? ticket.id}</p><h1 className="mt-2 text-2xl font-bold text-slate-900">{ticket.title}</h1></div><TicketStatusBadge status={ticket.status} /></div>
        <p className="whitespace-pre-wrap leading-7 text-slate-700">{ticket.description}</p>
        {ticket.complaintImages && ticket.complaintImages.length > 0 && (
          <TicketAttachments
            attachments={ticket.complaintImages}
            label="Images submitted by the user"
          />
        )}
        {ticket.responses && ticket.responses.length > 0 && <div className="space-y-3 rounded-xl bg-emerald-50 p-5"><h2 className="font-semibold text-emerald-950">Engineer response</h2>{ticket.responses.map((response) => <div key={response.id} className="border-t border-emerald-200 pt-3"><div className="flex flex-wrap justify-between gap-2 text-xs text-emerald-800"><span className="font-semibold">{response.authorName}</span><span>{response.createdAt}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">{response.message}</p>{response.attachments && response.attachments.length > 0 && <TicketAttachments attachments={response.attachments} label="Images submitted by the engineer" />}</div>)}</div>}
        <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2"><div><p className="text-sm text-slate-500">Requester</p><p className="mt-1 font-medium text-slate-800">{ticket.requester}</p><p className="text-sm text-slate-500">{ticket.requesterEmail}</p></div><div><p className="text-sm text-slate-500">Created</p><p className="mt-1 font-medium text-slate-800">{ticket.createdAt}</p></div><div><p className="text-sm text-slate-500">Category</p><p className="mt-1 font-medium text-slate-800">{ticket.category}</p></div><div><p className="text-sm text-slate-500">Priority</p><p className="mt-1 font-semibold text-slate-800">{ticket.priority}</p></div></div>
        <div className="border-t border-slate-100 pt-5"><p className="text-sm text-slate-500">Assigned engineer</p><div className="mt-2 flex flex-col gap-3 sm:flex-row"><select aria-label="Assign ticket to engineer" value={engineerId || ticket.assignedEngineerId || ""} onChange={(event) => setEngineerId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm sm:max-w-sm"><option value="">{ticket.assignedEngineer || "Choose engineer"}</option>{engineers.map((engineer) => <option key={engineer.id} value={engineer.id}>{engineer.name}</option>)}</select><button type="button" disabled={saving || !engineerId} onClick={() => void assign()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Assigning…" : "Save assignment"}</button></div>{ticket.assignedEngineer && <p className="mt-2 text-sm text-slate-600">Currently assigned to {ticket.assignedEngineer}.</p>}</div>
      </section>
    </div>
  );
}
