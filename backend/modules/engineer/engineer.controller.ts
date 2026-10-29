
import type { Request, Response } from "express";
import {
  TicketHistoryAction,
  TicketStatus,
  SparePartRequestStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../src/config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseImageAttachments } from "../../utils/imageAttachments.js";

const MAX_RESPONSE_IMAGE_COUNT = 5;
const MAX_RESPONSE_IMAGE_BYTES = 5 * 1024 * 1024;

// 1. Get all tickets assigned to the logged-in engineer
export const getAssignedTickets = asyncHandler(
  async (_req: Request, res: Response) => {
    const engineer = res.locals.user as { id: string };

    const tickets = await prisma.ticket.findMany({
      where: { employeeId: engineer.id },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  },
);

// 2. Get a single assigned ticket
export const getAssignedTicketById = asyncHandler(
  async (req: Request, res: Response) => {
    const engineer = res.locals.user as { id: string };
    const ticketId = req.params.id;

    if (typeof ticketId !== "string") {
      res.status(400).json({
        success: false,
        message: "A valid ticket ID is required",
      });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        employeeId: engineer.id,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        employee: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found or not assigned to you",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  },
);

// 3. Start working on an assigned ticket
export const startTicketWork = asyncHandler(
  async (req: Request, res: Response) => {
    const engineer = res.locals.user as { id: string };
    const ticketId = req.params.id;

    if (typeof ticketId !== "string") {
      res.status(400).json({
        success: false,
        message: "A valid ticket ID is required",
      });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        employeeId: engineer.id,
      },
      select: { id: true, status: true },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Assigned ticket not found",
      });
      return;
    }

    if (ticket.status !== TicketStatus.ASSIGNED) {
      res.status(409).json({
        success: false,
        message: "Only assigned tickets can be started",
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.IN_PROGRESS },
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
          comments: {
            where: { isInternal: false },
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: engineer.id,
          action: TicketHistoryAction.STATUS_CHANGED,
          oldStatus: TicketStatus.ASSIGNED,
          newStatus: TicketStatus.IN_PROGRESS,
          details: "Engineer started work",
        },
      });

      return result;
    });

    res.status(200).json({
      success: true,
      message: "Work started",
      data: updated,
    });
  },
);

// 4. Submit completion response and resolve ticket
export const submitTicketResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const engineer = res.locals.user as { id: string };
    const ticketId = req.params.id;
    const message = req.body?.message;
    const attachments = parseImageAttachments(
      req.body?.attachments,
      MAX_RESPONSE_IMAGE_COUNT,
      MAX_RESPONSE_IMAGE_BYTES,
    );

    if (typeof ticketId !== "string") {
      res.status(400).json({
        success: false,
        message: "A valid ticket ID is required",
      });
      return;
    }

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 3000 ||
      attachments === null
    ) {
      res.status(400).json({
        success: false,
        message:
          "Provide a response between 1 and 3000 characters and up to five valid images, each no larger than 5 MB.",
      });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        employeeId: engineer.id,
      },
      select: { id: true, status: true },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Assigned ticket not found",
      });
      return;
    }

    if (ticket.status !== TicketStatus.IN_PROGRESS) {
      res.status(409).json({
        success: false,
        message: "Start work on this ticket before submitting a response",
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: engineer.id,
          message: message.trim(),
          isInternal: false,
          attachments,
        },
      });

      const result = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.RESOLVED,
          resolvedAt: new Date(),
        },
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
          employee: {
            select: { id: true, name: true, email: true },
          },
          comments: {
            where: { isInternal: false },
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: engineer.id,
          action: TicketHistoryAction.STATUS_CHANGED,
          oldStatus: TicketStatus.IN_PROGRESS,
          newStatus: TicketStatus.RESOLVED,
          details: "Engineer submitted a completion response",
        },
      });

      return result;
    });

    res.status(200).json({
      success: true,
      message: "Response submitted and ticket resolved",
      data: updated,
    });
  },
);

// 5. Get spare-part requests submitted by this engineer
export const getSparePartRequests = asyncHandler(
  async (_req: Request, res: Response) => {
    const engineer = res.locals.user as { id: string };

    const requests = await prisma.sparePartRequest.findMany({
      where: { engineerId: engineer.id },
      orderBy: { createdAt: "desc" },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNo: true,
            title: true,
            status: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  },
);

// 6. Create a spare-part request
export const createSparePartRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const engineer = res.locals.user as { id: string };

    const { ticketId, partName, quantity, reason } = req.body ?? {};

    if (
      typeof ticketId !== "string" ||
      !ticketId.trim() ||
      typeof partName !== "string" ||
      !partName.trim() ||
      partName.trim().length > 150 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000 ||
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 2000
    ) {
      res.status(400).json({
        success: false,
        message:
          "Provide a valid ticket, part name, quantity (1–10000), and reason.",
      });
      return;
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId.trim(),
        employeeId: engineer.id,
        status: {
          in: [
            TicketStatus.ASSIGNED,
            TicketStatus.IN_PROGRESS,
          ],
        },
      },
      select: { id: true },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "No active ticket assigned to you was found.",
      });
      return;
    }

    const request = await prisma.sparePartRequest.create({
      data: {
        engineerId: engineer.id,
        ticketId: ticket.id,
        partName: partName.trim(),
        quantity,
        reason: reason.trim(),
        status: SparePartRequestStatus.PENDING,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNo: true,
            title: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Spare part request submitted successfully.",
      data: request,
    });
  },
);
