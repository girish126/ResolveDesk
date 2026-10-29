import { apiRequest } from "@/app/lib/api";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketImageAttachment,
} from "@/app/types/ticket";

type BackendTicket = {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";
  requesterId: string;
  createdAt: string;
  attachments?: TicketImageAttachment[];
  requester: { id: string; name: string; email: string };
  comments?: Array<{
    id: string;
    message: string;
    createdAt: string;
    attachments?: TicketImageAttachment[];
    author: { id: string; name: string; role: string };
  }>;
};

type ResponsePayload = { success: boolean; message?: string; data: BackendTicket };

const statuses: Record<BackendTicket["status"], TicketStatus> = {
  OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved", CLOSED: "Closed", REJECTED: "Rejected",
};
const priorities: Record<BackendTicket["priority"], TicketPriority> = {
  LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical",
};

function mapTicket(ticket: BackendTicket): Ticket {
  const responses = ticket.comments ?? [];
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    requester: ticket.requester.name,
    requesterEmail: ticket.requester.email,
    requesterId: ticket.requester.id,
    assignedEngineer: "",
    priority: priorities[ticket.priority],
    status: statuses[ticket.status],
    createdAt: new Date(ticket.createdAt).toLocaleString(),
    complaintImages: ticket.attachments ?? [],
    solutionNotes: responses.at(-1)?.message,
    responses: responses.map((response) => ({
      id: response.id,
      message: response.message,
      authorName: response.author.name,
      createdAt: new Date(response.createdAt).toLocaleString(),
      attachments: response.attachments ?? [],
    })),
  };
}

export const engineerService = {
  async getAssignedTickets() {
    const response = await apiRequest<{
      success: boolean;
      count: number;
      data: BackendTicket[];
    }>("/engineer/tickets");
    return response.data.map(mapTicket);
  },

  async startWork(ticketId: string) {
    const response = await apiRequest<ResponsePayload>(
      `/engineer/tickets/${encodeURIComponent(ticketId)}/start`,
      { method: "PATCH" },
    );
    return mapTicket(response.data);
  },

  async submitResponse(
    ticketId: string,
    message: string,
    attachments: TicketImageAttachment[],
  ) {
    const response = await apiRequest<ResponsePayload>(
      `/engineer/tickets/${encodeURIComponent(ticketId)}/respond`,
      { method: "POST", body: { message, attachments } },
    );
    return mapTicket(response.data);
  },
};
