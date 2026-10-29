
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, ShieldCheck, X } from "lucide-react";

import { sparePartService } from "@/app/services/spare-part.service";
import { engineerService } from "@/app/services/engineer.service";
import { prepareCameraImage } from "@/app/lib/prepareCameraImage";
import TicketStatusBadge from "@/app/components/tickets/TicketStatusBadge";
import TicketAttachments from "@/app/components/tickets/TicketAttachments";

import type { SparePartRequest } from "@/app/types/spare-part-request";
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

      resolve({ name: file.name, type: file.type, data: reader.result });
    };
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

const requestStatusStyles: Record<
  SparePartRequest["status"],
  string
> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function EngineerTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [partRequests, setPartRequests] = useState<
    SparePartRequest[]
  >([]);

  const [partName, setPartName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [partReason, setPartReason] = useState("");

  const [requestingPart, setRequestingPart] = useState(false);
  const [partNotice, setPartNotice] = useState("");

  const [note, setNote] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imagePreviewUrls = useRef(new Set<string>());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load ticket and spare-part requests.
  useEffect(() => {
    let active = true;

    async function loadTicket() {
      setLoading(true);
      setError("");

      try {
        const [assignedTickets, requests] = await Promise.all([
          engineerService.getAssignedTickets(),
          sparePartService.getEngineerRequests(),
        ]);

        if (!active) return;

        const assignedTicket = assignedTickets.find(
          (item) => item.id === id
        );

        if (!assignedTicket) {
          setTicket(null);
          setPartRequests([]);
          setError(
            "This ticket is not assigned to your account or is no longer available."
          );
          return;
        }

        setTicket(assignedTicket);

        setPartRequests(
          requests.filter((request) => request.ticket.id === id)
        );
      } catch (reason: unknown) {
        if (!active) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load this ticket. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) void loadTicket();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(
    () => () => {
      imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  async function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    const isCameraCapture =
      event.currentTarget.dataset.cameraCapture === "true";
    event.target.value = "";

    if (files.length === 0) return;

    if (selectedImages.length + files.length > MAX_IMAGES) {
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
    setImagePreviews((current) => [...current, ...newPreviews]);
    setSelectedImages((current) => [...current, ...filesToAdd]);
  }

  function removeImage(index: number) {
    const preview = imagePreviews[index];

    if (preview) {
      URL.revokeObjectURL(preview);
      imagePreviewUrls.current.delete(preview);
    }

    setImagePreviews((current) =>
      current.filter((_, i) => i !== index)
    );
    setSelectedImages((current) =>
      current.filter((_, i) => i !== index)
    );

    ["repair-images", "repair-camera"].forEach((inputId) => {
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) input.value = "";
    });
  }

  async function submitPartRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!ticket) return;

    const parsedQuantity = Number(quantity);

    if (
      !partName.trim() ||
      !partReason.trim() ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > 10000
    ) {
      setError("Enter a valid part name, reason, and quantity.");
      return;
    }

    setRequestingPart(true);
    setError("");
    setPartNotice("");

    try {
      const created = await sparePartService.createRequest({
        ticketId: ticket.id,
        partName: partName.trim(),
        quantity: parsedQuantity,
        reason: partReason.trim(),
      });

      setPartRequests((current) => [created, ...current]);
      setPartName("");
      setQuantity("1");
      setPartReason("");
      setPartNotice("Spare part request sent to the admin.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to submit spare part request."
      );
    } finally {
      setRequestingPart(false);
    }
  }

  async function startWork() {
    if (!ticket) return;

    setSaving(true);
    setError("");

    try {
      const updatedTicket = await engineerService.startWork(ticket.id);
      setTicket(updatedTicket);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to start work on this ticket."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitResponse() {
    if (!ticket) return;

    if (!note.trim()) {
      setError("Add a response describing the work you completed.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const attachments = await Promise.all(selectedImages.map(readImage));
      const updatedTicket = await engineerService.submitResponse(
        ticket.id,
        note.trim(),
        attachments,
      );

      setTicket(updatedTicket);
      setNote("");
      imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      imagePreviewUrls.current.clear();
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to submit your response."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/engineers/tickets"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to assigned tickets
        </Link>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh page
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
        >
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">
            Loading ticket details…
          </p>
        </div>
      ) : ticket ? (
        <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-600">
                {ticket.ticketNo ?? ticket.id}
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {ticket.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {ticket.category} · {ticket.priority} priority · Requested by{" "}
                {ticket.requester}
              </p>
            </div>

            <TicketStatusBadge status={ticket.status} />
          </div>

          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
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
              className="rounded-xl bg-slate-50 p-4"
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {response.authorName}
                </span>
                <span>{response.createdAt}</span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
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
              disabled={saving}
              onClick={() => void startWork()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Starting..." : "Start work"}
            </button>
          )}

          {/* Completion response with photo picker and previews */}
          {ticket.status === "In Progress" && (
            <section className="rounded-2xl border border-neutral-800 bg-black p-4 text-white sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500" />

                  <div>
                    <h2 className="font-semibold">
                      Completion response
                    </h2>
                    <p className="mt-1 text-sm text-neutral-400">
                      Describe the repair and attach evidence.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-blue-950/60 px-2 py-1 text-xs font-medium text-blue-400">
                  In Progress
                </span>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="completion-note"
                  className="mb-2 block text-sm font-semibold"
                >
                  Work completed
                </label>

                <textarea
                  id="completion-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={3000}
                  placeholder="Describe the repair or work completed..."
                  className="w-full resize-y rounded-xl border border-neutral-800 bg-black p-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="repair-images"
                  className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-600 px-4 py-6 text-center transition hover:border-blue-500 hover:bg-neutral-900"
                >
                  <ImagePlus className="mb-3 h-6 w-6 text-blue-500" />

                  <span className="text-sm font-semibold">
                    Attach repair photos
                  </span>

                  <span className="mt-2 text-sm text-neutral-400">
                    Select photos from your phone or computer. JPG, PNG, or WebP.
                  </span>

                  <span className="mt-3 text-sm font-medium text-blue-500">
                    + Choose images
                  </span>

                  <span className="mt-2 text-xs text-neutral-500">
                    Up to 5 images, 5 MB each
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="repair-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={saving || selectedImages.length >= MAX_IMAGES}
                    className="sr-only"
                    onChange={handleImageSelection}
                  />
                  <input
                    id="repair-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    data-camera-capture="true"
                    disabled={saving || selectedImages.length >= MAX_IMAGES}
                    className="sr-only"
                    onChange={handleImageSelection}
                  />
                  <label
                    htmlFor="repair-camera"
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                      saving || selectedImages.length >= MAX_IMAGES
                        ? "cursor-not-allowed border-neutral-700 text-neutral-500"
                        : "cursor-pointer border-neutral-700 text-white hover:bg-neutral-900"
                    }`}
                  >
                    <Camera size={16} />
                    Capture photo
                  </label>
                  <span className="text-xs text-neutral-400">
                    {selectedImages.length}/{MAX_IMAGES} photos selected
                  </span>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={`${selectedImages[index]?.name}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-neutral-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Repair evidence ${index + 1}`}
                          className="h-32 w-full object-cover"
                        />

                        <button
                          type="button"
                          aria-label={`Remove image ${index + 1}`}
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-black/80 p-1.5 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-start gap-2 text-sm text-neutral-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p>
                  Photos will be saved with your response and visible to the
                  requester and administrators.
                </p>
              </div>

              <button
                type="button"
                disabled={saving || !note.trim()}
                onClick={() => void submitResponse()}
                className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Sending response..."
                  : "Send response and resolve"}
              </button>
            </section>
          )}

          {/* Existing spare-parts section */}
          {(ticket.status === "Assigned" ||
            ticket.status === "In Progress") && (
            <section className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Spare parts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Request a part for this ticket. The admin will review your
                  request.
                </p>
              </div>

              {partNotice && (
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  {partNotice}
                </p>
              )}

              <form
                onSubmit={(event) => void submitPartRequest(event)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <label className="text-sm font-semibold text-slate-700">
                  Part name
                  <input
                    required
                    maxLength={150}
                    value={partName}
                    onChange={(event) => setPartName(event.target.value)}
                    placeholder="e.g. replacement cable"
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Why is this part needed?
                  <textarea
                    required
                    maxLength={2000}
                    rows={3}
                    value={partReason}
                    onChange={(event) => setPartReason(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={requestingPart}
                  className="w-fit rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestingPart
                    ? "Sending request..."
                    : "Request spare part"}
                </button>
              </form>

              {partRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Requests for this ticket
                  </h3>

                  {partRequests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800">
                          {request.partName} × {request.quantity}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            requestStatusStyles[request.status]
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {request.reason}
                      </p>

                      {request.adminNote && (
                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-semibold">
                            Admin note:
                          </span>{" "}
                          {request.adminNote}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </article>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="font-semibold text-slate-800">
            Ticket unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Check that you are signed in with the engineer account this ticket
            was assigned to.
          </p>
        </div>
      )}
    </main>
  );
}
