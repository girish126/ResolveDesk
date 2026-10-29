import type { Request, Response } from "express";
import { prisma } from "../../src/config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthError } from "../Auth/auth.service.js";

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const user = res.locals.user as { id: string };
    if (!user?.id) throw new AuthError(401, "Authentication required");

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications.map((notification) => ({
        ...notification,
        recipientId: notification.userId,
      })),
    });
  },
);

export const markNotificationRead = asyncHandler(
  async (req: Request, res: Response) => {
    const user = res.locals.user as { id: string };
    const notificationId = req.params.id;
    if (!user?.id) throw new AuthError(401, "Authentication required");

    if (typeof notificationId !== "string") {
      res.status(400).json({
        success: false,
        message: "A valid notification ID is required.",
      });
      return;
    }

    const updated = await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
      return;
    }

    res.status(200).json({ success: true });
  },
);

export const markAllNotificationsRead = asyncHandler(
  async (_req: Request, res: Response) => {
    const user = res.locals.user as { id: string };
    if (!user?.id) throw new AuthError(401, "Authentication required");

    const updated = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, count: updated.count });
  },
);
