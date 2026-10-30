
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
      <div className="space-y-3 p-3 xl:hidden">
        {tickets.map((ticket) => (
          <article
            key={ticket.id}
            className="space-y-4 rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  {ticket.ticketNo ?? ticket.id}
                </p>
                <h3 className="mt-1 wrap-break-word font-semibold text-slate-900">
                  {ticket.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{ticket.category}</p>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
              <div className="min-w-0">
                <p className="text-slate-500">Requester</p>
                <p className="mt-1 truncate font-medium text-slate-800">{ticket.requester}</p>
              </div>
              <div>
                <p className="text-slate-500">Priority</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-1 font-semibold ${priorityStyles[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500">Assigned engineer</p>
                <p className="mt-1 truncate font-medium text-slate-800">
                  {ticket.assignedEngineer || "Unassigned"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500">Created</p>
                <p className="mt-1 truncate font-medium text-slate-800">{ticket.createdAt}</p>
              </div>
            </div>

            {onAssign && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Assign engineer
                </span>
                <select
                  aria-label={`Assign ${ticket.id} to engineer`}
                  value={ticket.assignedEngineerId ?? ""}
                  onChange={(event) => event.target.value && onAssign(ticket, event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose engineer</option>
                  {engineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Link
                href={`${basePath}/${encodeURIComponent(ticket.id)}`}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <Eye size={16} /> View
              </Link>
              {onShare && ticket.assignedEngineerId && (
                <button
                  type="button"
                  onClick={() => onShare(ticket)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <MessageCircle size={16} /> Share
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(ticket)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-amber-50 hover:text-amber-700"
                >
                  <Pencil size={16} /> Edit
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto xl:block">
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
