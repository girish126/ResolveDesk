import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { isRefreshFamilyActive } from "../../modules/Auth/auth.service.js";
import { prisma } from "../config/prisma.js";

let io: Server | null = null;

export function initializeNotificationSocket(
  httpServer: HttpServer,
  allowedOrigins: string[],
) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const secret = process.env.JWT_ACCESS_SECRET;

    if (typeof token !== "string" || !secret) {
      next(new Error("Authentication required"));
      return;
    }

    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });
    } catch {
      next(new Error("Invalid or expired access token"));
      return;
    }

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      decoded.type !== "access" ||
      typeof decoded.familyId !== "string"
    ) {
      next(new Error("Invalid or expired access token"));
      return;
    }

    try {
      if (!(await isRefreshFamilyActive(decoded.familyId))) {
        next(new Error("This session has been logged out"));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, role: true, isActive: true },
      });

      if (!user?.isActive) {
        next(new Error("Account not found or inactive"));
        return;
      }

      socket.data.user = { id: user.id, role: user.role };
      next();
    } catch (error) {
      console.error("Notification socket authentication failed:", error);
      next(new Error("Unable to authenticate notification connection"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; role: string };
    void socket.join(`user:${user.id}`);
    console.log("Notification socket connected:", socket.id, user.role);

    socket.on("disconnect", () => {
      console.log("Notification socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getNotificationSocket() {
  if (!io) {
    throw new Error("Notification Socket.IO server is not initialized");
  }

  return io;
}