import type { Request, Response } from "express";
import { prisma } from "../../src/config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getDashboardSummary = asyncHandler(
  async (_req: Request, res: Response) => {
    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      assigned,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { status: "ASSIGNED" } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        open,
        assigned,
        inProgress,
        resolved,
        closed,
      },
    });
  }
);