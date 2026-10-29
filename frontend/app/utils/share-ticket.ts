const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

type ShareTicketParams = {
  ticketId: string;
  ticketNo: string;
  title: string;
  engineerName: string;
  engineerPhone?: string;
};

export function shareTicketOnWhatsApp({
  ticketId,
  ticketNo,
  title,
  engineerName,
  engineerPhone,
}: ShareTicketParams) {
  if (!FRONTEND_URL) {
    throw new Error("NEXT_PUBLIC_FRONTEND_URL is not configured.");
  }

  const ticketUrl =
    `${FRONTEND_URL}/dashboard/engineer/tickets/${encodeURIComponent(ticketId)}`;

  const message = [
    `Hello ${engineerName},`,
    `A complaint has been assigned to you.`,
    `Ticket: ${ticketNo}`,
    `Title: ${title}`,
    `Open your engineer portal to review and start work: ${ticketUrl}`,
  ].join("\n");

  const phone = (engineerPhone ?? "").replace(/\D/g, "");

  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}