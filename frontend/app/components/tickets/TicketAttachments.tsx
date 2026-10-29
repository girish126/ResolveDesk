import type { TicketImageAttachment } from "@/app/types/ticket";

type TicketAttachmentsProps = {
  attachments: TicketImageAttachment[];
  label: string;
};

export default function TicketAttachments({
  attachments,
  label,
}: TicketAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-3">
        {attachments.map((attachment, index) => (
          <a
            key={`${attachment.name}-${index}`}
            href={attachment.data}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
            aria-label={`Open ${attachment.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.data}
              alt={attachment.name}
              className="h-24 w-24 object-cover sm:h-28 sm:w-28"
            />
            <span className="block max-w-28 truncate px-2 py-1 text-xs text-slate-600">
              {attachment.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
