
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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <SlidersHorizontal size={16} />
            </span>
            <h2 className="font-semibold text-slate-900">Filter complaints</h2>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Refine the queue by keyword, status, or priority.
          </p>
        </div>
        {hasFilters && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Filters active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(10rem,1fr)_minmax(10rem,1fr)]">
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
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
