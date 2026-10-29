
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Plus, Ticket } from "lucide-react";

const myTickets = [
  { id: "CMP-1048", title: "Unable to access employee portal", status: "Open" },
  { id: "CMP-1046", title: "Software installation request", status: "Resolved" },
];

export default function UserDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">MY WORKSPACE</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Complaints
          </h1>
          <p className="mt-2 text-slate-500">
            Create a complaint and follow its progress.
          </p>
        </div>

        <Link
          href="/dashboard/user/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> New complaint
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total complaints", value: 2, icon: Ticket },
          { label: "Awaiting resolution", value: 1, icon: Clock3 },
          { label: "Resolved", value: 1, icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon size={22} className="text-blue-600" />
              <p className="mt-4 text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Recent complaints</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {myTickets.map((ticket) => (
            <div key={ticket.id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-blue-600">{ticket.id}</p>
                <h3 className="mt-1 font-semibold text-slate-800">{ticket.title}</h3>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  ticket.status === "Resolved"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-blue-700"
                }`}>
                  {ticket.status}
                </span>
              </div>

              <Link
                href={`/dashboard/user/${ticket.id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
              >
                View details <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-400">Sample complaint data only.</p>
    </div>
  );
}
