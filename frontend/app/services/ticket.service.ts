
import { apiRequest } from "@/app/lib/api";
import type {
  CreateTicketPayload,
  Ticket,
  TicketListResponse,
  TicketStatus,
  UpdateTicketPayload,
} from "@/app/types/ticket";
import { userService } from "@/app/services/user.service";

type TicketResponse = {
  ticket: Ticket;
};

export const ticketService = {
  getAll() {
    return apiRequest<TicketListResponse>("/tickets");
  },

  getById(id: string) {
    return apiRequest<TicketResponse>(
      `/tickets/${encodeURIComponent(id)}`,
    );
  },

  create(payload: CreateTicketPayload) {
    return userService.createTicket(payload);
  },

  update(id: string, payload: UpdateTicketPayload) {
    return apiRequest<TicketResponse>(
      `/tickets/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
  },

  updateStatus(id: string, status: TicketStatus) {
    return apiRequest<TicketResponse>(
      `/tickets/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: { status },
      },
    );
  },

  assignEngineer(id: string, engineerId: string) {
    return apiRequest<TicketResponse>(
      `/tickets/${encodeURIComponent(id)}/assign`,
      {
        method: "PATCH",
        body: { engineerId },
      },
    );
  },
};
