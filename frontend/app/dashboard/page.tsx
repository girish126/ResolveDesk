
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

const sections = [
  {
    title: "Admin Dashboard",
    description: "Monitor complaints, assign engineers, and review reports.",
    href: "/dashboard/admin",
    icon: ShieldCheck,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "All Complaints",
    description: "Review complaint details, priorities, and statuses.",
    href: "/dashboard/admin/tickets",
    icon: ClipboardList,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Manage Users",
    description: "View and manage registered users.",
    href: "/dashboard/users",
    icon: Users,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Manage Engineers",
    description: "Review your support team and assignments.",
    href: "/dashboard/engineers",
    icon: Wrench,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Reports",
    description: "Review complaint trends and resolution performance.",
    href: "/dashboard/reports",
    icon: BarChart3,
    color: "bg-rose-50 text-rose-600",
  },
];

export default function DashboardHomePage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          RESOLVEDESK WORKSPACE
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Welcome to your workspace
        </h1>
        <p className="mt-2 text-slate-500">
          Choose a section to manage your complaint workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className={`rounded-xl p-3 ${section.color}`}>
                  <Icon size={23} />
                </span>

                <ArrowRight
                  size={19}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                {section.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
