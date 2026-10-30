
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Clock3,
  Package,
  ShieldCheck,
  Ticket as TicketIcon,
  Wrench,
  X,
} from "lucide-react";

import TicketStatusBadge from "@/app/components/tickets/TicketStatusBadge";
import TicketAttachments from "@/app/components/tickets/TicketAttachments";
import { engineerService } from "@/app/services/engineer.service";
import { prepareCameraImage } from "@/app/lib/prepareCameraImage";
import type { Ticket, TicketImageAttachment } from "@/app/types/ticket";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function readImage(file: File): Promise<TicketImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Unable to read ${file.name}.`));
        return;
      }

      resolve({
        name: file.name,
        type: file.type,
        data: reader.result,
      });
    };
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function EngineerTicketsPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<
    Record<string, File[]>
  >({});
  const [imagePreviews, setImagePreviews] = useState<
    Record<string, string[]>
  >({});
  const imagePreviewUrls = useRef(new Set<string>());

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const search = searchQuery.toLowerCase();
  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        [
          ticket.ticketNo ?? "",
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.category,
          ticket.requester,
          ticket.status,
        ].some((value) => value.toLowerCase().includes(search)),
      ),
    [tickets, search],
  );
  const assignedCount = tickets.filter(
    (ticket) => ticket.status === "Assigned",
  ).length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "In Progress",
  ).length;

  const loadTickets = useCallback(async () => {
    try {
      setTickets(await engineerService.getAssignedTickets());
      setError("");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load assigned tickets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadTickets);
  }, [loadTickets]);

  useEffect(
    () => () => {
      imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  async function startWork(ticket: Ticket) {
    setSavingId(ticket.id);
    setError("");

    try {
      const updated = await engineerService.startWork(ticket.id);

      setTickets((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to start work on this ticket."
      );
    } finally {
      setSavingId("");
    }
  }

  async function handleImageSelection(
    ticketId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    const isCameraCapture =
      event.currentTarget.dataset.cameraCapture === "true";
    event.target.value = "";

    if (files.length === 0) return;

    const currentFiles = selectedImages[ticketId] ?? [];

    if (currentFiles.length + files.length > MAX_IMAGES) {
      setError(`Choose no more than ${MAX_IMAGES} images.`);
      return;
    }

    let filesToAdd = files;
    if (isCameraCapture) {
      try {
        filesToAdd = await Promise.all(files.map(prepareCameraImage));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to process the captured photo.",
        );
        return;
      }
    }

    const invalidFile = filesToAdd.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_IMAGE_SIZE
    );

    if (invalidFile) {
      setError(
        "Only JPG, PNG, or WebP images up to 5 MB each are allowed."
      );
      return;
    }

    setError("");
    const newPreviews = filesToAdd.map((file) => {
      const url = URL.createObjectURL(file);
      imagePreviewUrls.current.add(url);
      return url;
    });

    setSelectedImages((current) => ({
      ...current,
      [ticketId]: [...(current[ticketId] ?? []), ...filesToAdd],
    }));
    setImagePreviews((current) => ({
      ...current,
      [ticketId]: [...(current[ticketId] ?? []), ...newPreviews],
    }));
  }

  function removeImage(ticketId: string, index: number) {
    const preview = imagePreviews[ticketId]?.[index];

    if (preview) {
      URL.revokeObjectURL(preview);
      imagePreviewUrls.current.delete(preview);
    }

    setImagePreviews((current) => ({
      ...current,
      [ticketId]: (current[ticketId] ?? []).filter(
        (_, i) => i !== index
      ),
    }));

    setSelectedImages((current) => ({
      ...current,
      [ticketId]: (current[ticketId] ?? []).filter(
        (_, i) => i !== index
      ),
    }));

    [`repair-images-${ticketId}`, `repair-camera-${ticketId}`].forEach(
      (inputId) => {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (input) input.value = "";
      },
    );
  }

  async function submitResponse(ticket: Ticket) {
    const message = notes[ticket.id]?.trim();

    if (!message) {
      setError("Add a response describing the work you completed.");
      return;
    }

    setSavingId(ticket.id);
    setError("");

    try {
      const attachments = await Promise.all(
        (selectedImages[ticket.id] ?? []).map(readImage),
      );
      const updated = await engineerService.submitResponse(
        ticket.id,
        message,
        attachments,
      );

      setTickets((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setNotes((current) => ({
        ...current,
        [ticket.id]: "",
      }));

      const submittedPreviews = imagePreviews[ticket.id] ?? [];
      submittedPreviews.forEach((url) => {
        URL.revokeObjectURL(url);
        imagePreviewUrls.current.delete(url);
      });
      setImagePreviews((current) => {
        return {
          ...current,
          [ticket.id]: [],
        };
      });

      setSelectedImages((current) => ({
        ...current,
        [ticket.id]: [],
      }));
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to submit your response."
      );
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-7 sm:p-6 lg:p-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-indigo-950 to-blue-900 p-5 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200/20 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-200">
              <Wrench size={13} /> Engineer workspace
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your work queue
            </h1>
            <p className="mt-2 text-sm leading-6 text-indigo-100/80 sm:text-base">
              Review assigned complaints, record repair progress, and send a
              clear completion update when the work is done.
            </p>
          </div>
          <Link
            href="/dashboard/engineers/spare-parts"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
          >
            <Package size={17} /> Request a part <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section aria-label="Work queue summary" className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: "Assigned to you", value: tickets.length, helper: "Active tickets in your queue", icon: TicketIcon, color: "bg-blue-50 text-blue-700" },
          { label: "Ready to start", value: assignedCount, helper: "Begin work when you're ready", icon: Clock3, color: "bg-amber-50 text-amber-700" },
          { label: "In progress", value: inProgressCount, helper: "Need a completion update", icon: Wrench, color: "bg-indigo-50 text-indigo-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : item.value}</p>
                </div>
                <span className={`rounded-xl p-2.5 ${item.color}`}><Icon size={19} /></span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{item.helper}</p>
            </article>
          );
        })}
      </section>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Assigned complaints</h2>
          <p className="mt-1 text-sm text-slate-500">
            {search
              ? `${filteredTickets.length} result${filteredTickets.length === 1 ? "" : "s"} for “${searchQuery}”`
              : "Prioritize your queue and keep each requester informed."}
          </p>
        </div>
        <span className="mt-2 inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200 sm:mt-0 sm:self-auto">
          <TicketIcon size={14} className="text-indigo-600" />
          {loading ? "Loading" : `${filteredTickets.length} in view`}
        </span>
      </div>

      {search && (
        <p className="text-sm text-slate-500" role="status">
          Showing {filteredTickets.length} result
          {filteredTickets.length === 1 ? "" : "s"} for &quot;
          {searchQuery}&quot;
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-label="Loading assigned tickets">
          {[0, 1].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:px-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <TicketIcon size={24} />
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            {tickets.length ? "No matching tickets" : "No tickets assigned yet"}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            {tickets.length
              ? "Try another search term."
              : "Tickets assigned to your engineer account by an admin will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredTickets.map((ticket) => (
            <article
              key={ticket.id}
              className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:border-indigo-200 hover:shadow-md sm:space-y-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-all text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                    {ticket.ticketNo ?? ticket.id}
                  </p>

                  <h3 className="mt-1 wrap-break-word text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                    {ticket.title}
                  </h3>

                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
                    <span>{ticket.category}</span>
                    <span className="text-slate-300">•</span>
                    <span>{ticket.priority} priority</span>
                    <span className="text-slate-300">•</span>
                    <span>Requested by {ticket.requester}</span>
                  </p>
                </div>

                <TicketStatusBadge status={ticket.status} />
              </div>

              <p className="whitespace-pre-wrap wrap-break-word rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 sm:p-4">
                {ticket.description}
              </p>

              {ticket.complaintImages &&
                ticket.complaintImages.length > 0 && (
                  <TicketAttachments
                    attachments={ticket.complaintImages}
                    label="Images provided by the requester"
                  />
                )}

              {ticket.responses?.map((response) => (
                <div
                  key={response.id}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {response.authorName}
                    </span>
                    <span>{response.createdAt}</span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-700">
                    {response.message}
                  </p>
                  <TicketAttachments
                    attachments={response.attachments ?? []}
                    label="Response attachments"
                  />
                </div>
              ))}

              {ticket.status === "Assigned" && (
                <button
                  type="button"
                  disabled={savingId === ticket.id}
                  onClick={() => void startWork(ticket)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingId === ticket.id
                    ? "Starting..."
                    : "Start work"}
                </button>
              )}

              {ticket.status === "In Progress" && (
                <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />

                      <div>
                        <h3 className="text-sm font-semibold">
                          Completion response
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Describe the repair and attach evidence.
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                      In Progress
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor={`completion-note-${ticket.id}`}
                      className="mb-1.5 block text-sm font-semibold text-slate-800"
                    >
                      Work completed
                    </label>

                    <textarea
                      id={`completion-note-${ticket.id}`}
                      value={notes[ticket.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [ticket.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      maxLength={3000}
                      placeholder="Describe the repair or work completed..."
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`repair-images-${ticket.id}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Attach repair photos (optional)
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        id={`repair-images-${ticket.id}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={
                          (selectedImages[ticket.id]?.length ?? 0) >=
                          MAX_IMAGES
                        }
                        onChange={(event) =>
                          handleImageSelection(ticket.id, event)
                        }
                        className="block w-full max-w-xs cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-3 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200 disabled:opacity-50"
                      />
                      <input
                        id={`repair-camera-${ticket.id}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        data-camera-capture="true"
                        disabled={
                          (selectedImages[ticket.id]?.length ?? 0) >=
                          MAX_IMAGES
                        }
                        onChange={(event) =>
                          handleImageSelection(ticket.id, event)
                        }
                        className="sr-only"
                      />
                      <label
                        htmlFor={`repair-camera-${ticket.id}`}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                          (selectedImages[ticket.id]?.length ?? 0) >=
                          MAX_IMAGES
                            ? "cursor-not-allowed border-slate-200 text-slate-400"
                            : "cursor-pointer border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Camera size={16} />
                        Capture photo
                      </label>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG, or WebP · Maximum 5 images, 5 MB each
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedImages[ticket.id]?.length ?? 0}/{MAX_IMAGES} photos selected
                    </p>

                    {(imagePreviews[ticket.id]?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {imagePreviews[ticket.id].map(
                          (preview, index) => (
                            <div
                              key={`${selectedImages[ticket.id]?.[index]?.name}-${index}`}
                              className="relative"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preview}
                                alt={`Repair photo ${index + 1}`}
                                className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                              />

                              <button
                                type="button"
                                aria-label={`Remove photo ${index + 1}`}
                                onClick={() =>
                                  removeImage(ticket.id, index)
                                }
                                className="absolute -right-1 -top-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p>
                      Selected photos will be included with your response.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      savingId === ticket.id ||
                      !notes[ticket.id]?.trim()
                    }
                    onClick={() => void submitResponse(ticket)}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === ticket.id
                      ? "Sending response..."
                      : "Send response and resolve"}
                  </button>
                </section>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
