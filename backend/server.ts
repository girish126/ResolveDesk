
import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { prisma } from "./src/config/prisma.js";

import authRouter from "./modules/Auth/auth.routes.js";
import adminRouter from "./modules/Admin/admin.routes.js";
import publicDashboardRouter from "./modules/dashboard/public.routes.js";
import userRouter from "./modules/user/user.routes.js";
import engineerRouter from "./modules/engineer/engineer.routes.js";
import adminSparePartRouter from "./modules/Admin/spare-part.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { initializeNotificationSocket } from "./src/socket/notification.socket.js";

const app = express();

const PORT = Number(process.env.PORT) || 5001;
const HOST = "0.0.0.0";

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://192.168.1.19:3000",
].filter((origin): origin is string => Boolean(origin));

// --------------------------------------------------
// Security and middleware
// --------------------------------------------------
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as health checks
      // and server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.error("Blocked CORS origin:", origin);
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const acceptsImagePayload =
    (req.method === "POST" && req.path === "/api/user/tickets") ||
    (req.method === "POST" &&
      /^\/api\/engineer\/tickets\/[^/]+\/respond$/.test(req.path));

  express.json({ limit: acceptsImagePayload ? "36mb" : "100kb" })(
    req,
    res,
    next,
  );
});
app.use(cookieParser());

// --------------------------------------------------
// API status
// --------------------------------------------------
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "ResolveDesk Complaint Management API",
    status: "running",
  });
});

// --------------------------------------------------
// Database health check
// --------------------------------------------------
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      success: false,
      status: "error",
      database: "unavailable",
    });
  }
});

// --------------------------------------------------
// Authentication APIs
// --------------------------------------------------
app.use("/api/auth", authRouter);

// --------------------------------------------------
// Public dashboard APIs
// --------------------------------------------------
app.use("/api/public", publicDashboardRouter);

// --------------------------------------------------
// User APIs
// --------------------------------------------------
app.use("/api/user", userRouter);

// --------------------------------------------------
// Engineer APIs
// --------------------------------------------------
app.use("/api/engineer", engineerRouter);

// --------------------------------------------------
// Authenticated user notifications
// --------------------------------------------------
app.use("/api/notifications", notificationRouter);

// --------------------------------------------------
// Admin spare-part APIs
// Keep before the general admin router.
// --------------------------------------------------
app.use("/api/admin", adminSparePartRouter);

// --------------------------------------------------
// General admin APIs
// --------------------------------------------------
app.use("/api", adminRouter);

// --------------------------------------------------
// 404 handler
// --------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// --------------------------------------------------
// Error handler
// Keep after all routes and the 404 handler.
// --------------------------------------------------
app.use(errorHandler);

// --------------------------------------------------
// Start server on all network interfaces
// --------------------------------------------------
const server = createServer(app);
initializeNotificationSocket(server, allowedOrigins);

server.listen(PORT, HOST, () => {
  console.log(`ResolveDesk API listening on port ${PORT}`);
  console.log(`Local API: http://localhost:${PORT}`);
  console.log(`LAN API: http://192.168.1.19:${PORT}`);
  console.log(`Allowed frontend origins: ${allowedOrigins.join(", ")}`);
});

// --------------------------------------------------
// Graceful shutdown
// --------------------------------------------------
let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log(`${signal} received. Shutting down server...`);

  server.close(async (error) => {
    if (error) {
      console.error("Error closing HTTP server:", error);
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected.");
    } catch (disconnectError) {
      console.error("Error disconnecting Prisma:", disconnectError);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
