"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Plus, Ticket as TicketIcon } from "lucide-react";
import TicketStatusBadge from "@/app/components/tickets/TicketStatusBadge";
import useDemoSession from "@/app/hooks/useDemoSession";
import { userService } from "@/app/services/user.service";
import type { Ticket } from "@/app/types/ticket";

export default function UserDashboardPage() {
  const searchParams = useSearchParams();
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
  const activeCount = myTickets.length - resolvedCount;
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
    <section className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">USER WORKSPACE</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Complaints
          </h1>
          <p className="mt-2 text-slate-500">
            Track your requests and see their progress through support.
          </p>
        </div>
        <Link
          href="/dashboard/user/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} /> Raise a ticket
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total complaints", value: myTickets.length, icon: TicketIcon },
          { label: "Awaiting resolution", value: activeCount, icon: Clock3 },
          { label: "Resolved", value: resolvedCount, icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon size={21} className="text-blue-600" />
              <p className="mt-3 text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{loading ? "—" : item.value}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">Complaint history</h2>
        <p className="mt-1 text-sm text-slate-500">All complaints you have submitted, with their latest status.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading your tickets...
        </p>
      ) : filteredTickets.length ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/user/${encodeURIComponent(ticket.id)}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <TicketIcon size={20} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-blue-600">{ticket.ticketNo ?? ticket.id}</p>
                  <h2 className="mt-1 font-semibold text-slate-900">
                    {ticket.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.category} · Submitted {ticket.createdAt}
                  </p>
                </div>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <TicketIcon size={36} className="mx-auto text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-800">
            {myTickets.length ? "No matching complaints" : "No tickets yet"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {myTickets.length
              ? "Try another search term."
              : "Raise a ticket and the admin team will review it."}
          </p>
        </div>
      )}

    </section>
  );
}
