
"use client";

import { useState, type FormEvent } from "react";
import { MessageSquareHeart, Star } from "lucide-react";

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feedback</h1>
        <p className="mt-2 text-slate-500">
          Tell us how your complaint was handled.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <MessageSquareHeart size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Share your experience</h2>
            <p className="text-sm text-slate-500">
              Your feedback helps us improve.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="complaintId" className="text-sm font-semibold text-slate-700">
            Complaint ID
          </label>
          <input
            id="complaintId"
            name="complaintId"
            required
            placeholder="e.g. CMP-1048"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">
            How would you rate your experience?
          </legend>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`Rate ${value} out of 5`}
                aria-pressed={rating === value}
                className={`rounded-xl p-2 transition ${
                  value <= rating
                    ? "bg-amber-50 text-amber-500"
                    : "bg-slate-50 text-slate-300"
                }`}
              >
                <Star size={28} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">{rating} out of 5 stars</p>
        </fieldset>

        <div>
          <label htmlFor="feedback" className="text-sm font-semibold text-slate-700">
            Comments
          </label>
          <textarea
            id="feedback"
            name="feedback"
            rows={5}
            required
            placeholder="What went well? What could be improved?"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {submitted && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            Demo feedback submitted locally. It has not been saved to the database.
          </p>
        )}

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Submit feedback
        </button>
      </form>
    </div>
  );
}
