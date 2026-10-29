
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/prisma.js";
import { isRefreshFamilyActive } from "../modules/Auth/auth.service.js";

type AccessTokenPayload = {
  sub: string;
  type: "access";
  familyId: string;
};

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    let payload: AccessTokenPayload;

    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });

      if (
        typeof decoded === "string" ||
        typeof decoded.sub !== "string" ||
        decoded.type !== "access" ||
        typeof decoded.familyId !== "string"
      ) {
        res.status(401).json({
          success: false,
          message: "Invalid access token",
        });
        return;
      }

      payload = decoded as AccessTokenPayload;
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
      return;
    }

    if (!(await isRefreshFamilyActive(payload.familyId))) {
      res.status(401).json({
        success: false,
        message: "This session has been logged out. Please sign in again.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account not found or inactive",
      });
      return;
    }

    res.locals.user = user;
    req.user = { id: user.id };

    next();
  } catch (error) {
    next(error);
  }
}
