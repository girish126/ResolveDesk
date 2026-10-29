import { apiRequest } from "@/app/lib/api";
import type { AuthUser } from "@/app/types/auth";
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
  createdAt: string;
  attachments?: TicketImageAttachment[];
  requester: { id: string; name: string; email: string };
  employee: { id: string; name: string; email: string } | null;
  comments?: Array<{
    id: string;
    message: string;
    createdAt: string;
    attachments?: TicketImageAttachment[];
    author: { id: string; name: string; role: string };
  }>;
};

export type AdminSummary = {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

export type AdminEngineer = Pick<AuthUser, "id" | "name" | "email">;

const statusLabels: Record<BackendTicket["status"], TicketStatus> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

const priorityLabels: Record<BackendTicket["priority"], TicketPriority> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function toFrontendTicket(ticket: BackendTicket): Ticket {
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    requester: ticket.requester.name,
    requesterEmail: ticket.requester.email,
    requesterId: ticket.requester.id,
    assignedEngineer: ticket.employee?.name ?? "",
    assignedEngineerId: ticket.employee?.id,
    priority: priorityLabels[ticket.priority],
    status: statusLabels[ticket.status],
    createdAt: new Date(ticket.createdAt).toLocaleString(),
    complaintImages: ticket.attachments ?? [],
    solutionNotes: ticket.comments?.at(-1)?.message,
    responses: ticket.comments?.map((response) => ({
      id: response.id,
      message: response.message,
      authorName: response.author.name,
      createdAt: new Date(response.createdAt).toLocaleString(),
      attachments: response.attachments ?? [],
    })),
  };
}

export const adminService = {
  async getSummary() {
    const response = await apiRequest<{ success: boolean; data: AdminSummary }>(
      "/dashboard/summary",
    );
    return response.data;
  },

  async getTickets() {
    const response = await apiRequest<{
      success: boolean;
      count: number;
      data: BackendTicket[];
    }>("/tickets");
    return response.data.map(toFrontendTicket);
  },

  async getEngineers() {
    const response = await apiRequest<{
      success: boolean;
      count: number;
      data: AdminEngineer[];
    }>("/engineers");
    return response.data;
  },

  async assignTicket(ticketId: string, employeeId: string) {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      data: BackendTicket;
    }>(`/tickets/${encodeURIComponent(ticketId)}/assign`, {
      method: "PATCH",
      body: { employeeId },
    });
    return toFrontendTicket(response.data);
  },

  async getReportSummary() {
    const response = await apiRequest<{
      success: boolean;
      data: AdminSummary & { resolutionRate: number };
    }>("/reports/summary");
    return response.data;
  },
};
