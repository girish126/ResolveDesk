
import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/client.js";

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function authorize(...allowedRoles: UserRole[]) {
  return (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const user = res.locals.user as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}
