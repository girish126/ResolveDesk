
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type TicketItem = {
  id: string;
  title: string;
  category: string;
  requester: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed" | "Rejected";
  date: string;
};

type RecentTicketsProps = {
  tickets: TicketItem[];
};

const statusStyles: Record<TicketItem["status"], string> = {
  Open: "bg-blue-50 text-blue-700",
  Assigned: "bg-amber-50 text-amber-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
  Rejected: "bg-red-50 text-red-700",
};

const priorityStyles: Record<TicketItem["priority"], string> = {
  Critical: "text-red-600",
  High: "text-orange-600",
  Medium: "text-amber-600",
  Low: "text-slate-500",
};

export default function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Complaints
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest requests submitted by users
          </p>
        </div>

        <Link
          href="/dashboard/admin/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View all <ArrowRight size={16} />
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-medium text-slate-700">No complaints yet</p>
          <p className="mt-1 text-sm text-slate-500">
            New complaints will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Complaint</th>
                <th className="px-5 py-4 font-semibold">Requester</th>
                <th className="px-5 py-4 font-semibold">Priority</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {ticket.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ticket.id} · {ticket.category}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {ticket.requester}
                  </td>

                  <td
                    className={`px-5 py-4 font-semibold ${priorityStyles[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[ticket.status]}`}
                    >
                      {ticket.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {ticket.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        Showing {tickets.length} recent complaints
      </div>
    </section>
  );
}
