
"use client";

import Link from "next/link";
import { Eye, MessageCircle, Pencil, Ticket as TicketIcon } from "lucide-react";
import type { Ticket } from "../../types/ticket";
import type { AuthUser } from "../../types/auth";
import TicketStatusBadge from "./TicketStatusBadge";

type TicketTableProps = {
  tickets: Ticket[];
  onEdit?: (ticket: Ticket) => void;
  basePath?: string;
  engineers?: Pick<AuthUser, "id" | "name">[];
  onAssign?: (ticket: Ticket, engineerId: string) => void;
  onShare?: (ticket: Ticket) => void;
};

const priorityStyles = {
  Critical: "bg-red-50 text-red-700",
  High: "bg-orange-50 text-orange-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export default function TicketTable({
  tickets,
  onEdit,
  basePath = "/dashboard/admin/tickets",
  engineers = [],
  onAssign,
  onShare,
}: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
        <TicketIcon className="mx-auto text-slate-300" size={38} />
        <h3 className="mt-4 font-semibold text-slate-800">
          No complaints found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Try changing your filters or create a new complaint.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-225 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Complaint</th>
              <th className="px-5 py-4 font-semibold">Requester</th>
              <th className="px-5 py-4 font-semibold">Assign engineer</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Created</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-800">
                    {ticket.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.ticketNo ?? ticket.id} · {ticket.category}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-slate-700">
                    {ticket.requester}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.requesterEmail}
                  </p>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {onAssign ? (
                    <div className="flex min-w-56 items-center gap-2">
                      <select aria-label={`Assign ${ticket.id} to engineer`} value={ticket.assignedEngineerId ?? ""} onChange={(event) => event.target.value && onAssign(ticket, event.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs">
                        <option value="">Choose engineer</option>
                        {engineers.map((engineer) => <option key={engineer.id} value={engineer.id}>{engineer.name}</option>)}
                      </select>
                    </div>
                  ) : ticket.assignedEngineer || "Unassigned"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <TicketStatusBadge status={ticket.status} />
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                  {ticket.createdAt}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`${basePath}/${encodeURIComponent(ticket.id)}`}
                      aria-label={`View ${ticket.id}`}
                      title="View complaint"
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size={16} />
                    </Link>

                    {onShare && ticket.assignedEngineerId && (
                      <button
                        type="button"
                        onClick={() => onShare(ticket)}
                        aria-label={`Share ${ticket.ticketNo ?? ticket.id} via WhatsApp`}
                        title="Share via WhatsApp"
                        className="rounded-lg border border-slate-200 p-2 text-emerald-700 hover:bg-emerald-50"
                      >
                        <MessageCircle size={16} />
                      </button>
                    )}

                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(ticket)}
                        aria-label={`Edit ${ticket.id}`}
                        title="Edit complaint"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Showing {tickets.length} complaint{tickets.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
