
import type { Request, Response } from "express";
import {
  AuthError,
  registerUser,
  getSafeUser,
  loginWithTokens,
  refreshTokens,
  logoutRefreshToken,
} from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please check your registration details",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const user = await registerUser(parsed.data);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  }
);


export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email and password",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const result = await loginWithTokens(parsed.data);

    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
);


export const refresh = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AuthError(
        401,
        "Refresh token missing. Please log in again."
      );
    }

    const result = await refreshTokens(token);

    // Replace the cookie with the rotated refresh token.
    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    // Return BOTH new tokens.
    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
);

export const getMe = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthError(401, "Authentication required");
    }

    const user = await getSafeUser(userId);

    if (!user || !user.isActive) {
      throw new AuthError(401, "Authentication required");
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    const bodyToken =
      typeof req.body?.refreshToken === "string"
        ? req.body.refreshToken.trim()
        : "";
    const token = req.cookies?.refreshToken || bodyToken;

    if (token) {
      await logoutRefreshToken(token);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: token
        ? "Logged out successfully. This session has been revoked."
        : "Logout completed. No active refresh token was found.",
    });
  }
);

export const adminCheck = asyncHandler(
  async (_req: Request, res: Response) => {
    const user = res.locals.user as
      | { role?: string }
      | undefined;

    if (user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Administrator access required",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);
