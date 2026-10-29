
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, ShieldCheck } from "lucide-react";
import TicketForm from "@/app/components/tickets/TicketForm";
import useDemoSession from "@/app/hooks/useDemoSession";
import { userService } from "@/app/services/user.service";
import type { TicketFormData } from "@/app/types/ticket";

export default function NewComplaintPage() {
  const router = useRouter();
  const user = useDemoSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateComplaint(data: TicketFormData) {
    setLoading(true);
    setMessage("");

    try {
      if (!user || user.role !== "USER") {
        throw new Error("Sign in with a user account to submit a ticket.");
      }

      const ticket = await userService.createTicket(data, user);
      setMessage(`Ticket ${ticket.ticketNo ?? ticket.id} was submitted to the admin queue.`);
      window.setTimeout(() => router.push("/dashboard/user"), 1000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <Link
          href="/dashboard/user"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft size={17} /> Back to my complaints
        </Link>

        <header className="flex flex-col gap-5 rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-600 p-3 text-white shadow-sm shadow-blue-200">
              <ClipboardList size={23} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Support request
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Raise a complaint
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Tell us what happened. Clear details and photos help the
                support team investigate faster.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs font-medium text-emerald-800">
            <ShieldCheck size={17} className="text-emerald-600" />
            Reviewed by the support team
          </div>
        </header>

        {message && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </div>
        )}

        <TicketForm
          loading={loading}
          onSubmitTicket={handleCreateComplaint}
          onCancel={() => router.push("/dashboard/user")}
        />
      </div>
    </main>
  );
}
