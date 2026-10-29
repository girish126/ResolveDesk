
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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconColor}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5 text-xs">
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
