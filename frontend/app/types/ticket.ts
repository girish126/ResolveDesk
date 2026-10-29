
export type TicketStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Pending Review"
  | "Needs Changes"
  | "Resolved"
  | "Closed"
  | "Rejected";

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export type TicketImageAttachment = {
  name: string;
  type: string;
  data: string;
};

export type Ticket = {
  id: string;
  ticketNo?: string;
  title: string;
  description: string;
  category: string;
  requester: string;
  requesterEmail: string;
  assignedEngineer: string;
  assignedEngineerId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  solutionNotes?: string;
  proofFileName?: string;
  proofFileType?: string;
  proofFileData?: string;
  submittedForReviewAt?: string;
  reviewComment?: string;
  requesterId?: string;
  complaintImageName?: string;
  complaintImageType?: string;
  complaintImageData?: string;
  complaintImages?: TicketImageAttachment[];
  responses?: Array<{
    id: string;
    message: string;
    authorName: string;
    createdAt: string;
    attachments?: TicketImageAttachment[];
  }>;
}

export type TicketFormData = {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  complaintImages?: TicketImageAttachment[];
  complaintImageName?: string;
  complaintImageType?: string;
  complaintImageData?: string;
};

export type CreateTicketPayload = TicketFormData;

export type UpdateTicketPayload = Partial<CreateTicketPayload>;

export type TicketListResponse = {
  tickets: Ticket[];
};
