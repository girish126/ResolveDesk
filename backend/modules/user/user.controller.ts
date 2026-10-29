
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthError } from "../Auth/auth.service.js";
import {
  NotificationType,
  TicketPriority,
  TicketStatus,
  TicketHistoryAction,
} from "../../generated/prisma/client.js";
import { parseImageAttachments } from "../../utils/imageAttachments.js";
import {
  createNotifications,
  emitNotifications,
  type NotificationPayload,
} from "../notifications/notification.service.js";

const MAX_COMPLAINT_IMAGE_COUNT = 5;
const MAX_COMPLAINT_IMAGE_BYTES = 5 * 1024 * 1024;

export const createTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthError(401, "Authentication required");
    }

    const { title, description, category, priority } = req.body ?? {};
    const attachments = parseImageAttachments(
      req.body?.attachments,
      MAX_COMPLAINT_IMAGE_COUNT,
      MAX_COMPLAINT_IMAGE_BYTES,
    );

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150 ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      category.trim().length > 80
    ) {
      res.status(400).json({
        success: false,
        message: "Provide a title, description, and category.",
      });
      return;
    }

    if (attachments === null) {
      res.status(400).json({
        success: false,
        message:
          "Attach up to five valid JPG, PNG, or WebP images if needed. Images can be any size up to 5 MB each.",
      });
      return;
    }

    const allowedPriorities = Object.values(TicketPriority);
    const selectedPriority =
      priority === undefined ? TicketPriority.MEDIUM : priority;

    if (!allowedPriorities.includes(selectedPriority)) {
      res.status(400).json({
        success: false,
        message: "Invalid ticket priority.",
        allowedValues: allowedPriorities,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AuthError(401, "Account not found or inactive");
    }

    if (user.role !== "USER") {
      res.status(403).json({
        success: false,
        message: "Only users can raise complaints through this endpoint.",
      });
      return;
    }

    let notifications: NotificationPayload[] = [];
    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          ticketNo: `TKT-${randomUUID()}`,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          priority: selectedPriority,
          status: TicketStatus.OPEN,
          requesterId: user.id,
          attachments,
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: created.id,
          actorId: user.id,
          action: TicketHistoryAction.CREATED,
          newStatus: TicketStatus.OPEN,
          details: "Complaint created by user",
        },
      });

      notifications = await createNotifications(tx, {
        recipientIds: [user.id],
        ticketId: created.id,
        type: NotificationType.TICKET_CREATED,
        title: "Complaint submitted",
        message: `Your complaint ${created.ticketNo} was submitted successfully.`,
      });

      return created;
    });

    emitNotifications(notifications);

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: ticket,
    });
  }
);

export const getMyTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthError(401, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AuthError(401, "Account not found or inactive");
    }

    if (user.role !== "USER") {
      res.status(403).json({
        success: false,
        message: "Only users can access this endpoint.",
      });
      return;
    }

    const tickets = await prisma.ticket.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        feedback: true,
      },
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  }
);



export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthError(401, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AuthError(401, "User not found or inactive");
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  }
);
