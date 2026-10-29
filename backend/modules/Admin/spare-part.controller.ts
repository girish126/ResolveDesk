
import type { Request, Response } from "express";
import {
  SparePartRequestStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../src/config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAdminSparePartRequests = asyncHandler(
  async (_req: Request, res: Response) => {
    const requests = await prisma.sparePartRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNo: true,
            title: true,
            status: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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

export const reviewSparePartRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = res.locals.user as { id: string };
    const requestId = req.params.id;
    const { decision, adminNote } = req.body ?? {};

    if (
      typeof requestId !== "string" ||
      !["APPROVED", "REJECTED"].includes(decision)
    ) {
      res.status(400).json({
        success: false,
        message: "A valid request ID and decision are required.",
      });
      return;
    }

    if (
      adminNote !== undefined &&
      (typeof adminNote !== "string" || adminNote.length > 2000)
    ) {
      res.status(400).json({
        success: false,
        message: "Admin note must be a string of at most 2000 characters.",
      });
      return;
    }

    const existing = await prisma.sparePartRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Spare part request not found.",
      });
      return;
    }

    if (existing.status !== SparePartRequestStatus.PENDING) {
      res.status(409).json({
        success: false,
        message: "This request has already been reviewed.",
      });
      return;
    }

    // Only update a request that is still pending.
    const result = await prisma.sparePartRequest.updateMany({
      where: {
        id: requestId,
        status: SparePartRequestStatus.PENDING,
      },
      data: {
        status:
          decision === "APPROVED"
            ? SparePartRequestStatus.APPROVED
            : SparePartRequestStatus.REJECTED,
        adminNote: adminNote?.trim() || null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    if (result.count === 0) {
      res.status(409).json({
        success: false,
        message: "This request has already been reviewed.",
      });
      return;
    }

    const updated = await prisma.sparePartRequest.findUnique({
      where: { id: requestId },
      include: {
        engineer: {
          select: { id: true, name: true, email: true },
        },
        ticket: {
          select: {
            id: true,
            ticketNo: true,
            title: true,
            status: true,
          },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Spare part request ${decision.toLowerCase()} successfully.`,
      data: updated,
    });
  },
);
