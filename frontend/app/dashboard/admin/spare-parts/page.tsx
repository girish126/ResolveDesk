"use client";

import { useEffect, useState } from "react";
import { sparePartService } from "@/app/services/spare-part.service";
import type { SparePartRequest } from "@/app/types/spare-part-request";

const statusStyles: Record<SparePartRequest["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function AdminSparePartsPage() {
  const [requests, setRequests] = useState<SparePartRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    sparePartService.getAdminRequests()
      .then((loadedRequests) => {
        if (!active) return;
        setRequests(loadedRequests);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load spare part requests.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function reviewRequest(request: SparePartRequest, decision: "APPROVED" | "REJECTED") {
    setReviewingId(request.id);
    setError("");
    try {
      const updated = await sparePartService.reviewRequest(
        request.id,
        decision,
        notes[request.id] ?? "",
      );
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to review this request.");
    } finally {
      setReviewingId("");
    }
  }

  const pendingCount = requests.filter((request) => request.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <section>
        <p className="text-sm font-semibold text-blue-600">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Spare Part Requests
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review the part, ticket, and reason before approving or rejecting a
          request. You can include a note for the engineer.
        </p>
      </section>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div>
          <p className="text-sm font-semibold text-amber-900">Awaiting review</p>
          <p className="mt-1 text-sm text-amber-800">
            Requests that still need your decision
          </p>
        </div>
        <p className="text-3xl font-bold tabular-nums text-amber-700" aria-live="polite">
          {loading ? "…" : pendingCount}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading spare part requests...
        </p>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No spare part requests have been submitted.
        </p>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => {
            const isReviewing = reviewingId === request.id;

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Part requested
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {request.partName}
                      <span className="ml-2 inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">
                        Quantity: {request.quantity}
                      </span>
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[request.status]}`}
                  >
                    {request.status === "PENDING" ? "PENDING REVIEW" : request.status}
                  </span>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <dl className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Requested by
                      </dt>
                      <dd className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">
                        {request.engineer?.name ?? "Unknown engineer"}
                      </dd>
                      {request.engineer?.email && (
                        <dd className="mt-0.5 break-all text-sm text-slate-600">
                          {request.engineer.email}
                        </dd>
                      )}
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Related ticket
                      </dt>
                      <dd className="mt-1 wrap-break-word text-sm font-semibold text-blue-700">
                        {request.ticket.ticketNo}
                      </dd>
                      <dd className="mt-0.5 wrap-break-word text-sm text-slate-700">
                        {request.ticket.title}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Request date
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {new Date(request.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>

                  <section aria-label="Reason for request">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Why this part is needed
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                      {request.reason}
                    </p>
                  </section>

                  {request.status === "PENDING" ? (
                    <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Review this request
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Add an optional note, then choose whether to approve or reject.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`admin-note-${request.id}`}
                          className="text-sm font-semibold text-slate-700"
                        >
                          Note for the engineer <span className="font-normal text-slate-500">(optional)</span>
                        </label>
                        <textarea
                          id={`admin-note-${request.id}`}
                          maxLength={2000}
                          rows={3}
                          value={notes[request.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          placeholder="Explain your decision or share any instructions..."
                          disabled={isReviewing}
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                        />
                        <p className="mt-1 text-right text-xs text-slate-500">
                          {(notes[request.id] ?? "").length}/2000 characters
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => void reviewRequest(request, "APPROVED")}
                          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isReviewing ? "Saving decision..." : "Approve request"}
                        </button>
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => void reviewRequest(request, "REJECTED")}
                          className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isReviewing ? "Saving decision..." : "Reject request"}
                        </button>
                      </div>
                    </section>
                  ) : (
                    <section className="space-y-2 border-t border-slate-100 pt-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Review details
                      </h3>
                      <p className="text-sm text-slate-600">
                        {request.reviewedBy?.name
                          ? `Reviewed by ${request.reviewedBy.name}`
                          : "Reviewed"}
                        {request.reviewedAt
                          ? ` on ${new Date(request.reviewedAt).toLocaleString()}`
                          : ""}
                      </p>
                      {request.adminNote && (
                        <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                          <span className="font-semibold text-slate-900">
                            Admin note:{" "}
                          </span>
                          {request.adminNote}
                        </p>
                      )}
                    </section>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
