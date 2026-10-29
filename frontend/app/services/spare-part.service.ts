
import { apiRequest } from "@/app/lib/api";
import type {
  SparePartRequest,
  CreateSparePartRequestPayload,
} from "@/app/types/spare-part-request";

type ListResponse = {
  success: boolean;
  count?: number;
  data: SparePartRequest[];
};

type SingleResponse = {
  success: boolean;
  message: string;
  data: SparePartRequest;
};

export const sparePartService = {
  // Get all spare-part requests for admin
  async getAdminRequests(): Promise<SparePartRequest[]> {
    const response = await apiRequest<ListResponse>(
      "/admin/spare-part-requests",
    );

    return response.data;
  },

  // Get requests submitted by the logged-in engineer
  async getEngineerRequests(): Promise<SparePartRequest[]> {
    const response = await apiRequest<ListResponse>(
      "/engineer/spare-part-requests",
    );

    return response.data;
  },

  // Submit a spare-part request
  async createRequest(
    payload: CreateSparePartRequestPayload,
  ): Promise<SparePartRequest> {
    const response = await apiRequest<SingleResponse>(
      "/engineer/spare-part-requests",
      {
        method: "POST",
        body: payload,
      },
    );

    return response.data;
  },

  // Approve or reject a request (admin only)
  async reviewRequest(
    id: string,
    decision: "APPROVED" | "REJECTED",
    adminNote: string,
  ): Promise<SparePartRequest> {
    const response = await apiRequest<SingleResponse>(
      `/admin/spare-part-requests/${encodeURIComponent(id)}/review`,
      {
        method: "PATCH",
        body: { decision, adminNote },
      },
    );

    return response.data;
  },
};
