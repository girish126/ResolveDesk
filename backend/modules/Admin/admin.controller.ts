
import type { Request, Response } from "express";
import { prisma } from "../../src/config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getDashboardSummary = asyncHandler(
  async (_req: Request, res: Response) => {
    const [total, open, assigned, inProgress, resolved, closed] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "OPEN" } }),
        prisma.ticket.count({ where: { status: "ASSIGNED" } }),
        prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { status: "RESOLVED" } }),
        prisma.ticket.count({ where: { status: "CLOSED" } }),
      ]);

    res.json({
      success: true,
      data: { total, open, assigned, inProgress, resolved, closed },
    });
  }
);

export const getAllTickets = asyncHandler(
  async (_req: Request, res: Response) => {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
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
            author: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  }
);

export const getTicketById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "A valid ticket ID is required",
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
            author: { select: { id: true, name: true, role: true } },
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
        message: "Ticket not found",
      });
      return;
    }

    res.json({
      success: true,
      data: ticket,
    });
  },
);

export const getEngineers = asyncHandler(
  async (_req: Request, res: Response) => {
    const engineers = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "ENGINEER"] }, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      count: engineers.length,
      data: engineers,
    });
  }
);

export const assignTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const employeeId = req.body?.employeeId;

    if (
      typeof id !== "string" ||
      typeof employeeId !== "string" ||
      !employeeId.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "A valid ticket ID and employeeId are required",
      });
      return;
    }

    const [ticket, employee] = await Promise.all([
      prisma.ticket.findUnique({
        where: { id },
        select: { id: true, employeeId: true },
      }),
      prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true, name: true, role: true, isActive: true },
      }),
    ]);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    if (
      !employee ||
      !["EMPLOYEE", "ENGINEER"].includes(employee.role) ||
      !employee.isActive
    ) {
      res.status(400).json({
        success: false,
        message: "Selected engineer is invalid or inactive",
      });
      return;
    }

    const admin = res.locals.user as { id: string };

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          employeeId: employee.id,
          ...(ticket.employeeId ? {} : { status: "ASSIGNED" as const }),
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
              author: { select: { id: true, name: true, role: true } },
            },
          },
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          actorId: admin.id,
          action: "ASSIGNED",
          details: `Ticket assigned to ${employee.name}`,
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: "Ticket assigned successfully",
      data: updatedTicket,
    });
  }
);

export const getReportsSummary = asyncHandler(
  async (_req: Request, res: Response) => {
    const [total, open, assigned, inProgress, resolved, closed] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "OPEN" } }),
        prisma.ticket.count({ where: { status: "ASSIGNED" } }),
        prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { status: "RESOLVED" } }),
        prisma.ticket.count({ where: { status: "CLOSED" } }),
      ]);

    res.json({
      success: true,
      data: {
        total,
        open,
        assigned,
        inProgress,
        resolved,
        closed,
        resolutionRate:
          total === 0 ? 0 : Math.round((resolved / total) * 100),
      },
    });
  }
);

export const getSparePartRequests = asyncHandler(
  async (_req: Request, res: Response) => {
    const requests = await prisma.sparePartRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        engineer: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, ticketNo: true, title: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, count: requests.length, data: requests });
  }
);

export const reviewSparePartRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { decision, adminNote } = req.body ?? {};

    if (
      typeof id !== "string" ||
      (decision !== "APPROVED" && decision !== "REJECTED") ||
      (adminNote !== undefined &&
        (typeof adminNote !== "string" || adminNote.trim().length > 2000))
    ) {
      res.status(400).json({
        success: false,
        message: "A valid request ID, approval decision, and optional note (up to 2000 characters) are required",
      });
      return;
    }

    const admin = res.locals.user as { id: string };
    const result = await prisma.sparePartRequest.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: decision,
        adminNote: typeof adminNote === "string" ? adminNote.trim() || null : null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    if (result.count === 0) {
      const requestExists = await prisma.sparePartRequest.findUnique({
        where: { id },
        select: { id: true },
      });
      res.status(requestExists ? 409 : 404).json({
        success: false,
        message: requestExists
          ? "This request has already been reviewed"
          : "Spare part request not found",
      });
      return;
    }

    const request = await prisma.sparePartRequest.findUniqueOrThrow({
      where: { id },
      include: {
        engineer: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, ticketNo: true, title: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: `Spare part request ${decision.toLowerCase()}`,
      data: request,
    });
  }
);
