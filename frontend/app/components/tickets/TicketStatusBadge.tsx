
import type { TicketStatus } from "../../types/ticket";

type TicketStatusBadgeProps = {
  status: TicketStatus;
};

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Assigned: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Pending Review": "bg-violet-50 text-violet-700 ring-violet-600/20",
  "Needs Changes": "bg-orange-50 text-orange-700 ring-orange-600/20",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function TicketStatusBadge({
  status,
}: TicketStatusBadgeProps) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
