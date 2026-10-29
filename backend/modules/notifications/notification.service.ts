import type { Prisma } from "../../generated/prisma/client.js";
import {
  NotificationType,
  type Notification,
} from "../../generated/prisma/client.js";
import { getNotificationSocket } from "../../src/socket/notification.socket.js";

export type NotificationPayload = Notification & {
  recipientId: string;
};

type CreateNotificationInput = {
  recipientIds: string[];
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
};

export async function createNotifications(
  tx: Prisma.TransactionClient,
  input: CreateNotificationInput,
): Promise<NotificationPayload[]> {
  const admins = await tx.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  const recipientIds = new Set([
    ...input.recipientIds,
    ...admins.map((admin) => admin.id),
  ]);

  const notifications = await Promise.all(
    [...recipientIds].map((userId) =>
      tx.notification.create({
        data: {
          userId,
          ticketId: input.ticketId,
          type: input.type,
          title: input.title,
          message: input.message,
        },
      }),
    ),
  );

  return notifications.map((notification) => ({
    ...notification,
    recipientId: notification.userId,
  }));
}

export function emitNotifications(notifications: NotificationPayload[]) {
  if (notifications.length === 0) return;

  const io = getNotificationSocket();
  for (const notification of notifications) {
    io.to(`user:${notification.userId}`).emit(
      "notification:new",
      notification,
    );
  }
}
