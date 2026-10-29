
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";

import TicketStatusBadge from "@/app/components/tickets/TicketStatusBadge";
import TicketAttachments from "@/app/components/tickets/TicketAttachments";
import useDemoSession from "@/app/hooks/useDemoSession";
import { userService } from "@/app/services/user.service";
import type { Ticket } from "@/app/types/ticket";

export default function UserComplaintDetailsPage() {
  const params = useParams<{ id: string }>();
  const user = useDemoSession();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ticketId = decodeURIComponent(params.id);

  useEffect(() => {
    let active = true;

    if (!user) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    userService
      .getMyTickets(user)
      .then((myTickets) => {
        if (!active) return;

        setTickets(myTickets);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!active) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load ticket."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const ticket = tickets.find((item) => item.id === ticketId);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <p className="text-sm text-slate-500">
          Loading ticket...
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
        <Link
          href="/dashboard/user"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to my complaints
        </Link>

        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error || "Ticket not found in your account."}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/user"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to my complaints
      </Link>

      <section className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {/* Ticket heading */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="break-all text-xs font-semibold text-blue-600">
              {ticket.ticketNo ?? ticket.id}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {ticket.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Submitted {ticket.createdAt}
            </p>
          </div>

          <TicketStatusBadge status={ticket.status} />
        </div>

        {/* Complaint description */}
        <div>
          <h2 className="font-semibold text-slate-900">
            Problem description
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {ticket.description}
          </p>
        </div>

        {/* Complaint attachments */}
        {ticket.complaintImages &&
        ticket.complaintImages.length > 0 ? (
          <div>
            <h2 className="mb-3 font-semibold text-slate-900">
              Your attached images
            </h2>

            <TicketAttachments
              attachments={ticket.complaintImages}
              label="Complaint attachments"
            />
          </div>
        ) : ticket.complaintImageData ? (
          <div>
            <h2 className="mb-3 font-semibold text-slate-900">
              Your attached image
            </h2>

            <TicketAttachments
              attachments={[
                {
                  name:
                    ticket.complaintImageName ??
                    "Complaint attachment",
                  type:
                    ticket.complaintImageType ?? "image/jpeg",
                  data: ticket.complaintImageData,
                },
              ]}
              label="Your attached image"
            />
          </div>
        ) : null}

        {/* Ticket information */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Category</p>
            <p className="mt-1 font-semibold text-slate-800">
              {ticket.category}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Priority</p>
            <p className="mt-1 font-semibold text-slate-800">
              {ticket.priority}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Assigned employee
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {ticket.assignedEngineer ||
                "Waiting for admin assignment"}
            </p>
          </div>
        </div>

        {/* Engineer responses */}
        {ticket.responses && ticket.responses.length > 0 && (
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h2 className="font-semibold text-slate-900">
              Engineer responses
            </h2>

            {ticket.responses.map((response) => (
              <article
                key={response.id}
                className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <div className="flex flex-wrap justify-between gap-2 text-xs text-emerald-800">
                  <span className="font-semibold">
                    {response.authorName}
                  </span>

                  <span>{response.createdAt}</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
                  {response.message}
                </p>

                {response.attachments &&
                  response.attachments.length > 0 && (
                    <div className="mt-4 border-t border-emerald-100 pt-3">
                      <p className="mb-2 text-xs font-semibold text-emerald-900">
                        Engineer response photos
                      </p>

                      <TicketAttachments
                        attachments={response.attachments}
                        label="Engineer response photos"
                      />
                    </div>
                  )}
              </article>
            ))}
          </div>
        )}

        {/* Workflow information */}
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
          <MessageSquare
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="font-semibold text-blue-900">
              Ticket workflow
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              An admin assigns an engineer. The engineer starts work
              and sends a response when the ticket is resolved.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
