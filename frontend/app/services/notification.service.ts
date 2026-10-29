import { apiRequest } from "@/app/lib/api";

export type NotificationItem = {
  id: string;
  userId: string;
  recipientId: string;
  ticketId: string | null;
  type:
    | "TICKET_CREATED"
    | "TICKET_ASSIGNED"
    | "STATUS_CHANGED"
    | "NEW_COMMENT"
    | "TICKET_RESOLVED"
    | "FEEDBACK_RECEIVED"
    | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export const notificationService = {
  async getAll() {
    const response = await apiRequest<{
      success: boolean;
      count: number;
      data: NotificationItem[];
    }>("/notifications");

    if (!Array.isArray(response?.data)) {
      throw new Error("The notifications API returned an unexpected response.");
    }

    return response.data;
  },

  async markRead(id: string) {
    await apiRequest<{ success: boolean }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
    );
  },

  async markAllRead() {
    await apiRequest<{ success: boolean; count: number }>(
      "/notifications/read-all",
      { method: "PATCH" },
    );
  },
};
