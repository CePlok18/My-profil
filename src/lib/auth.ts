import type { UserRole } from "@/types/database";

export function getDashboardPath(role?: UserRole | string | null) {
  return role === "admin" ? "/admin/dashboard" : "/user/dashboard";
}
