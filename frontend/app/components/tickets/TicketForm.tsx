
"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import { prepareCameraImage } from "@/app/lib/prepareCameraImage";
import type {
  TicketFormData,
  TicketImageAttachment,
  TicketPriority,
} from "@/app/types/ticket";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type TicketFormProps = {
  onSubmitTicket: (data: TicketFormData) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
};

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

const priorities: TicketPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const categories = ["IT Support", "Hardware", "Software", "Network", "Other"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Could not read ${file.name}.`));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read ${file.name}.`));
    };

    reader.readAsDataURL(file);
  });
}

function formatImageSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TicketForm({
  onSubmitTicket,
  onCancel,
  loading = false,
}: TicketFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewsRef = useRef(new Set<string>());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(
    () => () => {
      imagePreviewsRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview),
      );
    },
    [],
  );

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const isCameraCapture =
      event.currentTarget.dataset.cameraCapture === "true";
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    setError("");
    setSuccessMessage("");

    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      setError(`You can attach a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    const acceptedImages: SelectedImage[] = [];
    const errors: string[] = [];
    let filesToAdd = selectedFiles;

    if (isCameraCapture) {
      try {
        filesToAdd = await Promise.all(
          selectedFiles.map(prepareCameraImage),
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to process the captured photo.",
        );
        return;
      }
    }

    for (const file of filesToAdd) {
      if (images.length + acceptedImages.length >= MAX_IMAGES) {
        errors.push(`You can attach a maximum of ${MAX_IMAGES} images.`);
        break;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: use JPG, PNG, or WebP.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(`${file.name}: the maximum file size is 5 MB.`);
        continue;
      }

      const duplicate = [...images, ...acceptedImages].some(
        (image) =>
          image.file.name === file.name &&
          image.file.size === file.size &&
          image.file.lastModified === file.lastModified,
      );

      if (duplicate) {
        errors.push(`${file.name}: this image is already selected.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      imagePreviewsRef.current.add(preview);
      acceptedImages.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview,
      });
    }

    if (acceptedImages.length > 0) {
      setImages((current) => [...current, ...acceptedImages]);
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    }
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.preview);
        imagePreviewsRef.current.delete(image.preview);
      }

      return current.filter((item) => item.id !== id);
    });

    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!title.trim() || !description.trim() || !category.trim()) {
      setError("Please complete the title, description, and category.");
      return;
    }

    if (title.trim().length > 150) {
      setError("Title cannot exceed 150 characters.");
      return;
    }

    if (category.trim().length > 80) {
      setError("Category cannot exceed 80 characters.");
      return;
    }

    if (images.length > MAX_IMAGES) {
      setError(`You can attach a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const complaintImages: TicketImageAttachment[] = await Promise.all(
        images.map(async ({ file }) => ({
          name: file.name,
          type: file.type,
          data: await fileToDataUrl(file),
        })),
      );

      const payload: TicketFormData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priority,
        complaintImages,
      };

      await onSubmitTicket(payload);

      setSuccessMessage("Complaint submitted successfully.");
      setTitle("");
      setDescription("");
      setCategory("");
      setPriority("Medium");
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview);
        imagePreviewsRef.current.delete(image.preview);
      });
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your complaint. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const formBusy = isSubmitting || loading;
  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <h2 className="text-lg font-bold text-slate-900">
          Complaint details
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fields marked <span className="font-semibold text-red-500">*</span>{" "}
          are required.
        </p>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-7">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        <div>
          <label
            htmlFor="ticket-title"
            className="block text-sm font-semibold text-slate-700"
          >
            Complaint title <span className="text-red-500">*</span>
          </label>
          <input
            id="ticket-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            required
            disabled={formBusy}
            placeholder="Briefly describe your issue"
            className={fieldClass}
          />
          <p className="mt-1.5 text-right text-xs text-slate-400">
            {title.length}/150
          </p>
        </div>

        <div>
          <label
            htmlFor="ticket-description"
            className="block text-sm font-semibold text-slate-700"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="ticket-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={5}
            disabled={formBusy}
            placeholder="Explain what happened, where it occurred, and what help you need."
            className={`${fieldClass} resize-y leading-6`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ticket-category"
              className="block text-sm font-semibold text-slate-700"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              disabled={formBusy}
              className={fieldClass}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ticket-priority"
              className="block text-sm font-semibold text-slate-700"
            >
              Priority
            </label>
            <select
              id="ticket-priority"
              value={priority}
              disabled={formBusy}
              onChange={(event) =>
                setPriority(event.target.value as TicketPriority)
              }
              className={fieldClass}
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section
          aria-labelledby="ticket-images-title"
          className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3
                id="ticket-images-title"
                className="text-sm font-semibold text-slate-800"
              >
                Add supporting images{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Choose up to 5 JPG, PNG, or WebP images. Any file size is
                allowed up to 5 MB per image, including KB-sized images.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {images.length} of {MAX_IMAGES} selected
            </span>
          </div>

          <label
            htmlFor="ticket-images"
            className={`mt-4 flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${
              formBusy || images.length >= MAX_IMAGES
                ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                : "cursor-pointer border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/50"
            }`}
          >
            <ImagePlus size={22} className="text-blue-600" />
            <span className="mt-2 text-sm font-semibold text-slate-800">
              {images.length >= MAX_IMAGES
                ? "Maximum number of images selected"
                : "Select images from your device"}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              You can select multiple images at the same time
            </span>
          </label>
          <div className="sr-only">
            <input
              ref={fileInputRef}
              id="ticket-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              disabled={formBusy || images.length >= MAX_IMAGES}
            />
            <input
              ref={cameraInputRef}
              id="ticket-camera"
              type="file"
              accept="image/*"
              capture="environment"
              data-camera-capture="true"
              onChange={handleImageChange}
              disabled={formBusy || images.length >= MAX_IMAGES}
            />
          </div>
          <label
            htmlFor="ticket-camera"
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              formBusy || images.length >= MAX_IMAGES
                ? "cursor-not-allowed border-slate-200 text-slate-400"
                : "cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            <Camera size={17} />
            Capture with camera
          </label>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="relative aspect-square bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.preview}
                      alt={`Complaint attachment ${index + 1}: ${image.file.name}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      disabled={formBusy}
                      aria-label={`Remove ${image.file.name}`}
                      className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="p-2">
                    <p
                      className="truncate text-xs font-medium text-slate-700"
                      title={image.file.name}
                    >
                      {image.file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatImageSize(image.file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={formBusy}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={formBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formBusy ? (
            <>
              <LoaderCircle size={17} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={17} />
              Submit complaint
            </>
          )}
        </button>
      </div>
    </form>
  );
}
