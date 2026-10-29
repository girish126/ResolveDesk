
import { apiRequest } from "@/app/lib/api";
import type { AuthUser } from "@/app/types/auth";
import type {
  Ticket,
  TicketFormData,
  TicketImageAttachment,
} from "@/app/types/ticket";

type BackendTicket = {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status:
    | "OPEN"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED"
    | "REJECTED";
  requesterId?: string;
  createdAt: string;
  attachments?: TicketImageAttachment[];
  employee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  comments?: Array<{
    id: string;
    message: string;
    createdAt: string;
    attachments?: TicketImageAttachment[];
    author: {
      id: string;
      name: string;
      role: string;
    };
  }>;
};

type UserTicketResponse = {
  success: boolean;
  message?: string;
  data: BackendTicket;
};

type UserProfileResponse = {
  success: boolean;
  data: AuthUser & {
    isActive: boolean;
    createdAt: string;
  };
};

const priorityToApi = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Critical: "CRITICAL",
} as const;

const priorityFromApi: Record<
  BackendTicket["priority"],
  Ticket["priority"]
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const statusFromApi: Record<
  BackendTicket["status"],
  Ticket["status"]
> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

function normalizeRole(role: AuthUser["role"]): AuthUser["role"] {
  return role === "EMPLOYEE" ? "ENGINEER" : role;
}

function mapTicket(
  ticket: BackendTicket,
  requester?: Pick<AuthUser, "id" | "name" | "email">,
): Ticket {
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    requester: requester?.name ?? "You",
    requesterEmail: requester?.email ?? "",
    requesterId: ticket.requesterId ?? requester?.id,
    assignedEngineer: ticket.employee?.name ?? "",
    assignedEngineerId: ticket.employee?.id,
    priority: priorityFromApi[ticket.priority],
    status: statusFromApi[ticket.status],
    createdAt: new Date(ticket.createdAt).toLocaleString(),
    complaintImages: ticket.attachments ?? [],
    complaintImageName: ticket.attachments?.[0]?.name,
    complaintImageType: ticket.attachments?.[0]?.type,
    complaintImageData: ticket.attachments?.[0]?.data,
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

export const userService = {
  async getMyProfile() {
    const response = await apiRequest<UserProfileResponse>("/user/me");

    if (!response?.data) {
      throw new Error("The profile API returned an unexpected response.");
    }

    return {
      ...response.data,
      role: normalizeRole(response.data.role),
    };
  },

  async createTicket(
    payload: TicketFormData,
    requester?: Pick<AuthUser, "id" | "name" | "email">,
  ) {
    const response = await apiRequest<UserTicketResponse>(
      "/user/tickets",
      {
        method: "POST",
        body: {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          priority: priorityToApi[payload.priority],
          attachments: payload.complaintImages ??
            (payload.complaintImageData
            ? [
                {
                  name: payload.complaintImageName ?? "complaint-image",
                  type: payload.complaintImageType ?? "",
                  data: payload.complaintImageData,
                },
              ]
            : []),
        },
      },
    );

    if (!response?.data) {
      throw new Error("The ticket API returned an unexpected response.");
    }

    return mapTicket(response.data, requester);
  },

  async getMyTickets(
    requester?: Pick<AuthUser, "id" | "name" | "email">,
  ) {
    const response = await apiRequest<{
      success: boolean;
      count: number;
      data: BackendTicket[];
    }>("/user/tickets");

    if (!Array.isArray(response?.data)) {
      throw new Error("The tickets API returned an unexpected response.");
    }

    return response.data.map((ticket) =>
      mapTicket(ticket, requester),
    );
  },
};
