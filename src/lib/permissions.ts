export type Role = "admin" | "sales_manager" | "sales_agent";

export type Permission =
  | "crm.read"
  | "crm.create"
  | "crm.update"
  | "crm.assign"
  | "crm.import"
  | "crm.export"
  | "crm.archive"
  | "crm.merge"
  | "crm.settings.manage"
  | "crm.financial.read"
  | "crm.financial.write"
  | "bookings.read"
  | "bookings.create"
  | "bookings.update";

const ALL_PERMISSIONS: Permission[] = [
  "crm.read", "crm.create", "crm.update", "crm.assign", "crm.import",
  "crm.export", "crm.archive", "crm.merge", "crm.settings.manage",
  "crm.financial.read", "crm.financial.write",
  "bookings.read", "bookings.create", "bookings.update",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  sales_manager: [
    "crm.read", "crm.create", "crm.update", "crm.assign",
    "bookings.read", "bookings.create", "bookings.update",
  ],
  sales_agent: [
    "crm.read", "crm.create", "crm.update",
    "bookings.read", "bookings.create", "bookings.update",
  ],
};

export interface PermissionContext {
  role: Role;
  extraPermissions: Permission[];
}

export function hasPermission(ctx: PermissionContext, permission: Permission): boolean {
  return ROLE_PERMISSIONS[ctx.role].includes(permission) || ctx.extraPermissions.includes(permission);
}

/** Admin-only, unrestricted dashboard sections sales roles must never reach. */
export const ADMIN_ONLY_PATH_PREFIXES = [
  "/admin/doctors",
  "/admin/services",
  "/admin/blog",
  "/admin/hero",
  "/admin/clinic",
  "/admin/members",
] as const;

/** Sections a sales_manager/sales_agent session is allowed into. */
export const SALES_ALLOWED_PATH_PREFIXES = [
  "/admin/crm",
  "/admin/bookings",
  "/admin/login",
] as const;
