
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Package,
  Ticket,
  Users,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

import StatCard from "@/app/components/dashboard/StatCard";
import RecentTickets, {
  type TicketItem,
} from "@/app/components/dashboard/RecentTickets";

import {
  adminService,
  type AdminSummary,
} from "@/app/services/admin.service";

import { sparePartService } from "@/app/services/spare-part.service";
import type { SparePartRequest } from "@/app/types/spare-part-request";
import type { Ticket as TicketRecord } from "@/app/types/ticket";

const emptySummary: AdminSummary = {
  total: 0,
  open: 0,
  assigned: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary>(emptySummary);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [engineerCount, setEngineerCount] = useState(0);

  const [sparePartRequests, setSparePartRequests] = useState<
    SparePartRequest[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sparePartError, setSparePartError] = useState("");
  const [sparePartsLoading, setSparePartsLoading] = useState(true);

  // Load dashboard summary, tickets, and engineers.
  useEffect(() => {
    let active = true;

    Promise.all([
      adminService.getSummary(),
      adminService.getTickets(),
      adminService.getEngineers(),
    ])
      .then(([nextSummary, nextTickets, engineers]) => {
        if (!active) return;

        setSummary(nextSummary);
        setTickets(nextTickets);
        setEngineerCount(engineers.length);
      })
      .catch((reason: unknown) => {
        if (!active) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load admin dashboard."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Load spare-part requests independently.
  useEffect(() => {
    let active = true;

    sparePartService
      .getAdminRequests()
      .then((requests) => {
        if (active) {
          setSparePartRequests(requests);
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;

        setSparePartError(
          reason instanceof Error
            ? reason.message
            : "Unable to load spare-part requests."
        );
      })
      .finally(() => {
        if (active) setSparePartsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recentTickets: TicketItem[] = tickets.slice(0, 5).map((ticket) => ({
    id: ticket.ticketNo ?? ticket.id,
    title: ticket.title,
    category: ticket.category,
    requester: ticket.requester,
    priority: ticket.priority,
    status: ticket.status as TicketItem["status"],
    date: ticket.createdAt,
  }));

  // The API returns assigned tickets with employeeId.
  // Some frontend ticket types may instead use assignedEngineerId.
  const unassigned = tickets.filter((ticket) => {
    const record = ticket as TicketRecord & {
      employeeId?: string | null;
      assignedEngineerId?: string | null;
    };

    return !record.employeeId && !record.assignedEngineerId;
  }).length;

  const pendingSpareParts = sparePartRequests.filter(
    (request) => request.status === "PENDING"
  );

  const statusItems = [
    {
      label: "Resolved",
      count: summary.resolved,
      color: "bg-emerald-500",
    },
    {
      label: "In Progress",
      count: summary.inProgress,
      color: "bg-violet-500",
    },
    {
      label: "Assigned",
      count: summary.assigned,
      color: "bg-amber-500",
    },
    {
      label: "Open",
      count: summary.open,
      color: "bg-blue-500",
    },
    {
      label: "Closed",
      count: summary.closed,
      color: "bg-slate-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Dashboard heading */}
      <header>
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          ADMIN WORKSPACE
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Dashboard Overview
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor complaints and your support team&apos;s progress.
        </p>

        {/* Ticket management and WhatsApp workflow shortcuts */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/tickets"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Ticket size={18} />
            Manage & Assign Tickets
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/dashboard/admin/tickets"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <MessageCircle size={18} />
            Assign & Share on WhatsApp
          </Link>
        </div>
      </header>

      {/* Main dashboard error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Summary cards */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Complaints"
          value={loading ? "…" : summary.total}
          description="All submitted tickets"
          icon={Ticket}
          iconColor="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Open Complaints"
          value={loading ? "…" : summary.open}
          description="Waiting for assignment"
          icon={AlertCircle}
          iconColor="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="In Progress"
          value={loading ? "…" : summary.inProgress}
          description="Being handled"
          icon={Clock3}
          iconColor="bg-violet-50 text-violet-600"
        />

        <StatCard
          title="Resolved"
          value={loading ? "…" : summary.resolved}
          description="Resolved tickets"
          icon={CheckCircle2}
          iconColor="bg-emerald-50 text-emerald-600"
        />
      </section>

      {/* Spare-part requests */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Package size={18} className="text-blue-600" />
              Spare-part requests
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {sparePartsLoading ? "…" : pendingSpareParts.length}
              <span className="ml-2 text-sm font-normal text-slate-500">
                awaiting review
              </span>
            </p>
          </div>

          <Link
            href="/dashboard/admin/spare-parts"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Review requests
          </Link>
        </div>

        {sparePartError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {sparePartError}
          </p>
        ) : sparePartsLoading ? (
          <p className="mt-4 text-sm text-slate-500">
            Loading spare-part requests...
          </p>
        ) : sparePartRequests.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No spare-part requests have been submitted.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {sparePartRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {request.partName}
                    <span className="font-normal text-slate-500">
                      {" "}× {request.quantity}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {request.engineer?.name} · {request.ticket.ticketNo} ·{" "}
                    {request.ticket.title}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    request.status === "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : request.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ticket status and support team */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">
            Ticket status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current distribution from your backend
          </p>

          <div className="mt-6 space-y-5">
            {statusItems.map((item) => {
              const percentage = summary.total
                ? (item.count / summary.total) * 100
                : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>

                    <span className="text-slate-500">
                      {loading ? "…" : item.count}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Support team
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Live workload overview
          </p>

          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <Users size={16} />
                Active engineers
              </span>

              <span className="font-bold text-slate-900">
                {loading ? "…" : engineerCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Unassigned tickets
              </span>

              <span className="font-bold text-amber-600">
                {loading ? "…" : unassigned}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/admin/tickets"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View all tickets
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Recent tickets */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading recent tickets…
        </div>
      ) : (
        <RecentTickets tickets={recentTickets} />
      )}
    </div>
  );
}
