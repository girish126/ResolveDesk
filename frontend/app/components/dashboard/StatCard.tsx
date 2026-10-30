
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down";
};

export default function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  iconColor = "bg-blue-50 text-blue-600",
  trend = "up",
}: StatCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500/70 via-blue-400/20 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {value}
          </p>
        </div>

        <div className={`rounded-2xl p-3.5 transition duration-200 group-hover:scale-105 ${iconColor}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
        {change && <span
          className={`inline-flex items-center gap-0.5 font-semibold ${
            trend === "up" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          <TrendIcon size={15} />
          {change}
        </span>}
        <span className="text-slate-400">{description}</span>
      </div>
    </article>
  );
}
