
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PackagePlus, RefreshCw } from "lucide-react";
import { engineerService } from "@/app/services/engineer.service";
import { sparePartService } from "@/app/services/spare-part.service";
import type { Ticket } from "@/app/types/ticket";
import type {
  SparePartRequest,
  SparePartRequestStatus,
} from "@/app/types/spare-part-request";

const statusStyles: Record<SparePartRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

function isActiveTicket(ticket: Ticket): boolean {
  const status = String(ticket.status).toUpperCase().replaceAll(" ", "_");
  return status === "ASSIGNED" || status === "IN_PROGRESS";
}

export default function EngineerSparePartsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [requests, setRequests] = useState<SparePartRequest[]>([]);
  const [ticketId, setTicketId] = useState("");
  const [partName, setPartName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    try {
      const [assignedTickets, submittedRequests] = await Promise.all([
        engineerService.getAssignedTickets(),
        sparePartService.getEngineerRequests(),
      ]);

      const activeTickets = assignedTickets.filter(isActiveTicket);

      setTickets(activeTickets);
      setRequests(submittedRequests);

      setTicketId((current) =>
        activeTickets.some((ticket) => ticket.id === current)
          ? current
          : "",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load spare part data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  function refreshData() {
    setLoading(true);
    setError("");
    void loadData();
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedName = partName.trim();
    const trimmedReason = reason.trim();
    const parsedQuantity = Number(quantity);

    if (!ticketId) {
      setError("Please select an assigned ticket.");
      return;
    }

    if (!trimmedName || trimmedName.length > 150) {
      setError("Part name must contain 1–150 characters.");
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > 10000
    ) {
      setError("Quantity must be an integer between 1 and 10000.");
      return;
    }

    if (!trimmedReason || trimmedReason.length > 2000) {
      setError("Reason must contain 1–2000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await sparePartService.createRequest({
        ticketId,
        partName: trimmedName,
        quantity: parsedQuantity,
        reason: trimmedReason,
      });

      setRequests((current) => [created, ...current]);
      setPartName("");
      setQuantity("1");
      setReason("");
      setNotice("Spare part request sent to the admin successfully.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the spare part request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          ENGINEER WORKSPACE
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Spare Parts
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Request replacement parts for active tickets and track admin decisions.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <form
        onSubmit={submitRequest}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <PackagePlus size={20} className="text-blue-600" />
          New part request
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Assigned ticket
            <select
              required
              value={ticketId}
              onChange={(event) => setTicketId(event.target.value)}
              disabled={loading || submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select an active ticket</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.ticketNo ?? ticket.id} — {ticket.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Part name
            <input
              required
              maxLength={150}
              value={partName}
              onChange={(event) => setPartName(event.target.value)}
              placeholder="e.g. Replacement cable"
              disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Quantity
            <input
              required
              type="number"
              min={1}
              max={10000}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Why is this part needed?
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe the fault and why the part is required."
            disabled={submitting}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || loading || tickets.length === 0}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending request..." : "Send to admin"}
        </button>

        {!loading && tickets.length === 0 && (
          <p className="text-sm text-amber-700">
            No active assigned tickets found. You need an assigned or in-progress
            ticket before requesting a part.
          </p>
        )}
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Your requests ({requests.length})
          </h2>

          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading spare part requests...
          </p>
        ) : requests.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No spare part requests yet.
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {request.partName}{" "}
                      <span className="font-normal text-slate-500">
                        × {request.quantity}
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.ticket.ticketNo} · {request.ticket.title}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[request.status]
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {request.reason}
                </p>

                {request.adminNote && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-semibold">Admin note: </span>
                    {request.adminNote}
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  Requested {new Date(request.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
