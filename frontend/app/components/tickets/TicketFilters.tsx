
"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { TicketPriority, TicketStatus } from "../../types/ticket";

export type TicketFilterStatus = "All" | TicketStatus;
export type TicketFilterPriority = "All" | TicketPriority;

type TicketFiltersProps = {
  search: string;
  status: TicketFilterStatus;
  priority: TicketFilterPriority;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TicketFilterStatus) => void;
  onPriorityChange: (value: TicketFilterPriority) => void;
};

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function TicketFilters({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}: TicketFiltersProps) {
  const hasFilters =
    search.trim() !== "" || status !== "All" || priority !== "All";

  function clearFilters() {
    onSearchChange("");
    onStatusChange("All");
    onPriorityChange("All");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-slate-500" />
        <h2 className="font-semibold text-slate-800">Filter complaints</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search ID, title, requester..."
            aria-label="Search complaints"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as TicketFilterStatus)
          }
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="All">All statuses</option>
          <option value="Open">Open</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Needs Changes">Needs Changes</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={priority}
          onChange={(event) =>
            onPriorityChange(event.target.value as TicketFilterPriority)
          }
          aria-label="Filter by priority"
          className={selectClass}
        >
          <option value="All">All priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <X size={15} />
          Clear filters
        </button>
      )}
    </section>
  );
}
