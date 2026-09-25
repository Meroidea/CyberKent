import type { Role } from "@prisma/client";

/**
 * Council's role ladder, in one place.
 *
 * Officer < Admin < Super admin. A super admin can do everything an admin can,
 * so every check that admits an administrator admits a super admin too; the
 * one thing reserved to super admins is appointing, removing or suspending
 * administrators — which is what keeps a single compromised admin account
 * from locking out everyone else.
 */
export const STAFF_ROLES: Role[] = ["OFFICER", "ADMIN", "SUPER_ADMIN"];
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];

export const isStaffRole = (role: Role | string | undefined): boolean => STAFF_ROLES.includes(role as Role);
export const isAdminRole = (role: Role | string | undefined): boolean => ADMIN_ROLES.includes(role as Role);

/** Roles above officer are administrators' business; only a super admin grants or removes them. */
export const needsSuperAdmin = (role: Role): boolean => isAdminRole(role);
