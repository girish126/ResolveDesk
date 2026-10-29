
export type SparePartRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface SparePartRequest {
  id: string;
  engineerId: string;
  ticketId: string;
  partName: string;
  quantity: number;
  reason: string;
  status: SparePartRequestStatus;
  adminNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  engineer?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  ticket: {
    id: string;
    ticketNo: string;
    title: string;
    status?: string;
  };
}

export interface CreateSparePartRequestPayload {
  ticketId: string;
  partName: string;
  quantity: number;
  reason: string;
}
