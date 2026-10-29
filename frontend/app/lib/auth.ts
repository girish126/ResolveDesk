import type { UserRole } from "@/app/types/auth";

export function getDashboardPath(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "ENGINEER":
    case "EMPLOYEE":
      return "/dashboard/engineers/tickets";
    case "USER":
      return "/dashboard/user";
  }
}
