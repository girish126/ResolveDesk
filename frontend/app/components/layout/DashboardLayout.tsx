
"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";

const stats = [
  {
    title: "Total Complaints",
    value: "248",
    change: "+12.5%",
    description: "vs. last month",
    icon: Ticket,
    color: "bg-blue-50 text-blue-600",
    positive: true,
  },
  {
    title: "Open Complaints",
    value: "42",
    change: "+4.3%",
    description: "vs. last month",
    icon: AlertCircle,
    color: "bg-amber-50 text-amber-600",
    positive: false,
  },
  {
    title: "In Progress",
    value: "67",
    change: "+8.2%",
    description: "vs. last month",
    icon: Clock3,
    color: "bg-violet-50 text-violet-600",
    positive: true,
  },
  {
    title: "Resolved",
    value: "139",
    change: "+18.6%",
    description: "vs. last month",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
    positive: true,
  },
];

const tickets = [
  {
    id: "CMP-1048",
    title: "Unable to access employee portal",
    category: "IT Support",
    requester: "Rahul Sharma",
    priority: "High",
    status: "Open",
    date: "Today, 10:42 AM",
    initials: "RS",
  },
  {
    id: "CMP-1047",
    title: "Printer not working on second floor",
    category: "Hardware",
    requester: "Priya Singh",
    priority: "Medium",
    status: "In Progress",
    date: "Today, 09:18 AM",
    initials: "PS",
  },
  {
    id: "CMP-1046",
    title: "Request for software installation",
    category: "Software",
    requester: "Amit Verma",
    priority: "Low",
    status: "Resolved",
    date: "Yesterday",
    initials: "AV",
  },
  {
    id: "CMP-1045",
    title: "Network connection keeps dropping",
    category: "Network",
    requester: "Neha Gupta",
    priority: "Critical",
    status: "Open",
    date: "Yesterday",
    initials: "NG",
  },
  {
    id: "CMP-1044",
    title: "Email account configuration issue",
    category: "IT Support",
    requester: "Vikas Kumar",
    priority: "Medium",
    status: "In Progress",
    date: "20 Oct 2026",
    initials: "VK",
  },
];

const statusStyles: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<string, string> = {
  Critical: "text-red-600",
  High: "text-orange-600",
  Medium: "text-amber-600",
  Low: "text-slate-500",
};

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Wednesday, October 21, 2026
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard Overview
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Here&apos;s what&apos;s happening with your complaints today.
            </p>
          </div>

        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const ChangeIcon = stat.positive
              ? ArrowUpRight
              : ArrowDownRight;

            return (
              <article
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs">
                  <ChangeIcon
                    size={15}
                    className={
                      stat.positive ? "text-emerald-600" : "text-red-500"
                    }
                  />
                  <span
                    className={
                      stat.positive
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-red-500"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-slate-400">{stat.description}</span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Complaint Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current distribution by status
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                This month
              </span>
            </div>

            <div className="mt-8 space-y-6">
              {[
                { label: "Resolved", count: 139, color: "bg-emerald-500" },
                { label: "In Progress", count: 67, color: "bg-violet-500" },
                { label: "Open", count: 42, color: "bg-blue-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-slate-500">
                      {item.count} complaints
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.count / 248) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs text-slate-500">Resolution rate</p>
                <p className="mt-1 text-xl font-bold text-slate-900">56%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg. resolution</p>
                <p className="mt-1 text-xl font-bold text-slate-900">4.2 hrs</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Satisfaction</p>
                <p className="mt-1 text-xl font-bold text-slate-900">94%</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Common administrative tasks
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/dashboard/admin/tickets"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                  <Ticket size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">
                    Manage complaints
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Review and assign tickets
                  </span>
                </span>
                <ArrowRight size={17} className="text-slate-400" />
              </Link>

              <Link
                href="/dashboard/engineers"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
                  <Wrench size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">
                    Manage engineers
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Review your support team
                  </span>
                </span>
                <ArrowRight size={17} className="text-slate-400" />
              </Link>

              <Link
                href="/dashboard/users"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
                  <Users size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">
                    Manage users
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    View registered users
                  </span>
                </span>
                <ArrowRight size={17} className="text-slate-400" />
              </Link>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
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
              View all complaints <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Complaint</th>
                  <th className="px-6 py-4 font-semibold">Requester</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">
                        {ticket.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.id} · {ticket.category}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {ticket.initials}
                        </span>
                        <span className="font-medium text-slate-700">
                          {ticket.requester}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 font-semibold ${priorityStyles[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                          statusStyles[ticket.status] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                      {ticket.date}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/admin/tickets/${ticket.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            Sample dashboard data — backend integration will be added later.
          </div>
        </section>
      </div>
    </main>
  );
}
