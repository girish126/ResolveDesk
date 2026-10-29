
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  UserRound,
  Wrench,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

import { apiRequest } from "@/app/lib/api";
import TicketAttachments from "@/app/components/tickets/TicketAttachments";
import type { TicketImageAttachment } from "@/app/types/ticket";

type BackendStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

type BackendTicket = {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: BackendStatus;
  requesterId: string;
  employeeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  attachments: TicketImageAttachment[];
  requester: {
    id: string;
    name: string;
    email: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  comments: Array<{
    id: string;
    message: string;
    createdAt: string;
    attachments: TicketImageAttachment[];
    author: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  history?: Array<{
    id: string;
    action: string;
    details: string | null;
    oldStatus: BackendStatus | null;
    newStatus: BackendStatus | null;
    createdAt: string;
  }>;
};

type Engineer = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const statusStyles: Record<BackendStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  ASSIGNED: "bg-violet-50 text-violet-700 ring-violet-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

const priorityStyles: Record<BackendTicket["priority"], string> = {
  LOW: "text-slate-600 bg-slate-100",
  MEDIUM: "text-blue-700 bg-blue-50",
  HIGH: "text-orange-700 bg-orange-50",
  CRITICAL: "text-red-700 bg-red-50",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function AdminTicketDetailsPage() {
  const params = useParams<{ id: string }>();
  const ticketId = decodeURIComponent(params.id);

  const [ticket, setTicket] = useState<BackendTicket | null>(null);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ApiResponse<BackendTicket>>(
        `/tickets/${encodeURIComponent(ticketId)}`,
      );

      setTicket(response.data);
      setSelectedEngineerId(response.data.employeeId ?? "");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const loadEngineers = useCallback(async () => {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: Engineer[];
      }>("/engineers");

      setEngineers(response.data);
    } catch (err: unknown) {
      setError(
        `Unable to load engineers: ${getErrorMessage(err)}`,
      );
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadTicket();
      void loadEngineers();
    });
  }, [loadTicket, loadEngineers]);

  async function assignEngineer() {
    if (!selectedEngineerId) {
      setError("Please select an engineer.");
      return;
    }

    if (assigning) return;

    setAssigning(true);
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<ApiResponse<BackendTicket>>(
        `/tickets/${encodeURIComponent(ticketId)}/assign`,
        {
          method: "PATCH",
          body: {
            employeeId: selectedEngineerId,
          },
        },
      );

      setTicket(response.data);
      setSelectedEngineerId(response.data.employeeId ?? "");
      setNotice(response.message ?? "Engineer assigned successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading ticket details...
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
        <Link
          href="/dashboard/admin/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to tickets
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <h1 className="font-semibold">Unable to load ticket</h1>
              <p className="mt-1 text-sm">{error || "Ticket not found."}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadTicket()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/admin/tickets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={17} />
            Back to tickets
          </Link>

          <button
            type="button"
            onClick={() => {
              void loadTicket();
              void loadEngineers();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={19} className="shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="break-all text-sm font-semibold text-blue-600">
                {ticket.ticketNo}
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {ticket.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Created {formatDate(ticket.createdAt)}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyles[ticket.status]}`}
            >
              {ticket.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <UserRound size={18} />
                Requester
              </div>

              <p className="mt-4 font-medium text-slate-800">
                {ticket.requester.name}
              </p>
              <p className="mt-1 break-all text-sm text-slate-500">
                {ticket.requester.email}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Wrench size={18} />
                Assigned engineer
              </div>

              <p className="mt-4 font-medium text-slate-800">
                {ticket.employee?.name ?? "Not assigned"}
              </p>

              {ticket.employee?.email && (
                <p className="mt-1 break-all text-sm text-slate-500">
                  {ticket.employee.email}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Category</p>
              <p className="mt-1 font-medium text-slate-800">
                {ticket.category}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Priority</p>
              <span
                className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${priorityStyles[ticket.priority]}`}
              >
                {ticket.priority}
              </span>
            </div>

            <div>
              <p className="text-sm text-slate-500">Last updated</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(ticket.updatedAt)}
              </p>
            </div>
          </div>

          {ticket.resolvedAt && (
            <div className="mt-4">
              <p className="text-sm text-slate-500">Resolved at</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(ticket.resolvedAt)}
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="font-semibold text-slate-900">
              Problem description
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {ticket.description}
            </p>
            <TicketAttachments
              attachments={ticket.attachments ?? []}
              label="Images attached by requester"
            />
          </div>
        </section>

        {/* Assignment */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <UserCheck size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Engineer assignment
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Select an engineer and save the assignment to the backend.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedEngineerId}
              onChange={(event) =>
                setSelectedEngineerId(event.target.value)
              }
              disabled={assigning}
              aria-label="Select engineer"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >
              <option value="">Choose an engineer</option>

              {engineers.map((engineer) => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.name} ({engineer.email})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void assignEngineer()}
              disabled={
                assigning ||
                !selectedEngineerId ||
                selectedEngineerId === ticket.employeeId
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assigning && (
                <RefreshCw size={16} className="animate-spin" />
              )}
              {assigning ? "Saving..." : "Save assignment"}
            </button>
          </div>

          {engineers.length === 0 && (
            <p className="text-sm text-slate-500">
              No engineers were returned. Check the admin engineers API.
            </p>
          )}
        </section>

        {/* Public comments / engineer responses */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Responses and comments
            </h2>
          </div>

          {!ticket.comments || ticket.comments.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No public responses or comments have been added.
            </p>
          ) : (
            <div className="space-y-4">
              {ticket.comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {comment.author.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {comment.author.role}
                      </p>
                    </div>

                    <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={13} />
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {comment.message}
                  </p>
                  <TicketAttachments
                    attachments={comment.attachments ?? []}
                    label="Response attachments"
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        {ticket.history && ticket.history.length > 0 && (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Ticket history
            </h2>

            <div className="space-y-4">
              {ticket.history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 border-l-2 border-slate-200 pl-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      {entry.action.replaceAll("_", " ")}
                    </p>

                    {entry.details && (
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.details}
                      </p>
                    )}

                    {(entry.oldStatus || entry.newStatus) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.oldStatus ?? "—"}
                        {" → "}
                        {entry.newStatus ?? "—"}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
