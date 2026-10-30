
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ticket as TicketIcon } from "lucide-react";

import TicketFilters, {
  type TicketFilterPriority,
  type TicketFilterStatus,
} from "@/app/components/tickets/TicketFilters";

import TicketTable from "@/app/components/tickets/TicketTable";
import type { Ticket } from "@/app/types/ticket";
import {
  adminService,
  type AdminEngineer,
} from "@/app/services/admin.service";

export default function AdminTicketsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [engineers, setEngineers] = useState<AdminEngineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const search = searchParams.get("search") ?? "";
  const [status, setStatus] = useState<TicketFilterStatus>("All");
  const [priority, setPriority] =
    useState<TicketFilterPriority>("All");
  const [assigningId, setAssigningId] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [nextTickets, nextEngineers] = await Promise.all([
        adminService.getTickets(),
        adminService.getEngineers(),
      ]);

      setTickets(nextTickets);
      setEngineers(nextEngineers);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load admin tickets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  // Assign ticket to engineer.
  async function assignTicket(
    ticket: Ticket,
    engineerId: string
  ) {
    setAssigningId(ticket.id);

    try {
      const updatedTicket = await adminService.assignTicket(
        ticket.id,
        engineerId
      );

      setTickets((current) =>
        current.map((item) =>
          item.id === updatedTicket.id ? updatedTicket : item
        )
      );

      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to assign this ticket."
      );
    } finally {
      setAssigningId("");
    }
  }

  // Share ONLY the ticket URL through WhatsApp.
  function shareTicketViaWhatsApp(ticket: Ticket) {
    if (!ticket.assignedEngineer) {
      setError("Please assign this ticket before sharing it.");
      return;
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    ).replace(/\/+$/, "");

    const ticketUrl =
      `${appUrl}/dashboard/engineers/tickets/${encodeURIComponent(
        ticket.id
      )}`;

    // WhatsApp message contains only the ticket URL.
    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(ticketUrl)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setError("");
  }

  // Search and filter tickets.
  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        [
          ticket.ticketNo ?? "",
          ticket.id,
          ticket.title,
          ticket.requester,
          ticket.category,
          ticket.assignedEngineer,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (status === "All" || ticket.status === status) &&
        (priority === "All" || ticket.priority === priority)
      );
    });
  }, [tickets, search, status, priority]);

  function updateSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-7 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard/admin" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-blue-700">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Ticket queue
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Search incoming complaints, assign the right engineer, and keep
            every request moving.
          </p>
        </div>
        <span className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm sm:self-auto">
          <TicketIcon size={16} className="text-blue-600" />
          {loading ? "Loading queue" : `${tickets.length} total tickets`}
        </span>
      </div>

      {/* Ticket statistics */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tickets shown</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {filteredTickets.length}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Open</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-blue-800">
            {tickets.filter((ticket) => ticket.status === "Open").length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Resolved</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-800">
            {tickets.filter(
              (ticket) => ticket.status === "Resolved"
            ).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <TicketFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={updateSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Ticket table */}
      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading tickets…
        </p>
      ) : filteredTickets.length > 0 ? (
        <TicketTable
          tickets={filteredTickets}
          engineers={engineers}
          onAssign={(ticket, engineerId) =>
            void assignTicket(ticket, engineerId)
          }
          onShare={shareTicketViaWhatsApp}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <TicketIcon
            size={36}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 font-semibold text-slate-800">
            No matching tickets
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Try another search term or clear your filters.
          </p>
        </div>
      )}

      {/* Assignment progress */}
      {assigningId && (
        <p
          aria-live="polite"
          className="text-sm text-slate-500"
        >
          Saving ticket assignment…
        </p>
      )}
    </div>
  );
}
