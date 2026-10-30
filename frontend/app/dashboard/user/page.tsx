"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Ticket as TicketIcon,
} from "lucide-react";
import TicketStatusBadge from "@/app/components/tickets/TicketStatusBadge";
import useDemoSession from "@/app/hooks/useDemoSession";
import { userService } from "@/app/services/user.service";
import type { Ticket } from "@/app/types/ticket";

export default function UserDashboardPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const user = useDemoSession();
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      let active = true;
      void Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return () => { active = false; };
    }
    let active = true;
    userService.getMyTickets(user)
      .then((tickets) => {
        if (active) {
          setMyTickets(tickets);
          setError("");
        }
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load your tickets."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const resolvedCount = myTickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Closed").length;
  const activeCount = myTickets.filter(
    (ticket) => !["Resolved", "Closed", "Rejected"].includes(ticket.status),
  ).length;
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const filteredTickets = useMemo(
    () =>
      myTickets.filter((ticket) =>
        [
          ticket.ticketNo ?? "",
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.category,
          ticket.status,
        ].some((value) => value.toLowerCase().includes(search)),
      ),
    [myTickets, search],
  );

  return (
    <section className="mx-auto max-w-6xl space-y-5 p-4 sm:space-y-7 sm:p-6 lg:p-8">
      <header className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-white via-blue-50 to-sky-100 p-5 shadow-sm sm:p-8">
        <div aria-hidden="true" className="absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 ring-1 ring-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Your support space
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              My complaints
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Follow every request from submission to resolution. We&apos;ll
              keep the latest updates and responses together here.
            </p>
          </div>
          <Link
            href="/dashboard/user/new"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus size={18} /> Raise a complaint
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          {
            label: "Total complaints",
            value: myTickets.length,
            icon: TicketIcon,
            color: "bg-blue-50 text-blue-700",
            helper: "All requests you've submitted",
          },
          {
            label: "Active requests",
            value: activeCount,
            icon: Clock3,
            color: "bg-amber-50 text-amber-700",
            helper: "Being handled by support",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-700",
            helper: "Completed requests",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {loading ? "—" : item.value}
                  </p>
                </div>
                <span className={`rounded-xl p-2.5 ${item.color}`}>
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{item.helper}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Complaint history</h2>
          <p className="mt-1 text-sm text-slate-500">
            {search
              ? `${filteredTickets.length} result${filteredTickets.length === 1 ? "" : "s"} for “${searchParams.get("search")}”`
              : "Your latest requests and their current status."}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200 sm:self-auto">
          <TicketIcon size={15} className="text-blue-600" />
          {loading ? "Loading" : `${filteredTickets.length} shown`}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-label="Loading complaints">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : filteredTickets.length ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/user/${encodeURIComponent(ticket.id)}`}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600 ring-1 ring-blue-100">
                  <TicketIcon size={19} />
                </span>
                <div className="min-w-0">
                  <p className="break-all text-[11px] font-bold uppercase tracking-wide text-blue-700">{ticket.ticketNo ?? ticket.id}</p>
                  <h3 className="mt-1 truncate font-semibold text-slate-900 group-hover:text-blue-700">
                    {ticket.title}
                  </h3>
                  <p className="mt-1 wrap-break-word text-xs text-slate-500 sm:text-sm">
                    {ticket.category}
                    <span className="mx-1.5 text-slate-300">•</span>
                    Submitted {ticket.createdAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
                <TicketStatusBadge status={ticket.status} />
                <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-12 text-center sm:px-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            {myTickets.length ? <Search size={24} /> : <TicketIcon size={24} />}
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            {myTickets.length ? "No matching complaints" : "Nothing here yet"}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            {myTickets.length
              ? "Try another search term, or clear your search to see all your complaints."
              : "When you submit a complaint, you can follow its progress and support replies here."}
          </p>
          {myTickets.length ? (
            <Link href={pathname} className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              Clear search
            </Link>
          ) : (
            <Link href="/dashboard/user/new" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700">
              <Plus size={17} /> Raise your first complaint
            </Link>
          )}
        </div>
      )}

    </section>
  );
}
