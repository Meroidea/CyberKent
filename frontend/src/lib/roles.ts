import type { Role } from "@/lib/account/types";

/**
 * The console's role ladder — officer < admin < super admin — mirrored from
 * the API. Hiding a screen here is a courtesy; the API refuses anyone else.
 */
export const STAFF_ROLES: Role[] = ["OFFICER", "ADMIN", "SUPER_ADMIN"];
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];

export const isStaff = (role: Role | undefined | null): boolean => !!role && STAFF_ROLES.includes(role);
export const isAdmin = (role: Role | undefined | null): boolean => !!role && ADMIN_ROLES.includes(role);
export const isSuperAdmin = (role: Role | undefined | null): boolean => role === "SUPER_ADMIN";

export const ROLE_NAME: Record<Role, string> = {
  RESIDENT: "Resident",
  BUSINESS: "Business",
  OFFICER: "Officer",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super administrator",
};
