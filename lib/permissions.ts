export type UserRole = "ADMIN" | "WAREHOUSE_MANAGER" | "INVENTORY_CLERK" | "TECHNICIAN" | "AUDITOR"

export interface Permission {
  resource: string
  actions: string[]
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    { resource: "users", actions: ["create", "read", "update", "delete"] },
    { resource: "warehouses", actions: ["create", "read", "update", "delete"] },
    { resource: "inventory", actions: ["create", "read", "update", "delete"] },
    { resource: "transfers", actions: ["create", "read", "update", "delete", "approve"] },
    { resource: "audits", actions: ["create", "read", "update", "delete"] },
    { resource: "reports", actions: ["create", "read", "update", "delete"] },
    { resource: "settings", actions: ["read", "update"] },
    { resource: "dashboard", actions: ["read"] },
  ],
  WAREHOUSE_MANAGER: [
    { resource: "warehouses", actions: ["read", "update"] },
    { resource: "inventory", actions: ["create", "read", "update", "delete"] },
    { resource: "transfers", actions: ["create", "read", "update", "approve"] },
    { resource: "audits", actions: ["create", "read", "update"] },
    { resource: "reports", actions: ["create", "read"] },
    { resource: "users", actions: ["read"] },
    { resource: "dashboard", actions: ["read"] },
  ],
  INVENTORY_CLERK: [
    { resource: "inventory", actions: ["create", "read", "update"] },
    { resource: "transfers", actions: ["create", "read"] },
    { resource: "audits", actions: ["read"] },
    { resource: "reports", actions: ["read"] },
    { resource: "dashboard", actions: ["read"] },
  ],
  TECHNICIAN: [
    { resource: "inventory", actions: ["read"] },
    { resource: "transfers", actions: ["read"] },
    { resource: "reports", actions: ["read"] },
    { resource: "dashboard", actions: ["read"] },
  ],
  AUDITOR: [
    { resource: "audits", actions: ["create", "read", "update", "delete"] },
    { resource: "inventory", actions: ["read"] },
    { resource: "warehouses", actions: ["read"] },
    { resource: "reports", actions: ["create", "read"] },
    { resource: "dashboard", actions: ["read"] },
  ],
}

export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  const resourcePermission = permissions.find((p) => p.resource === resource)
  return resourcePermission?.actions.includes(action) || false
}

export function getAccessibleRoutes(userRole: UserRole) {
  const routes = []

  if (hasPermission(userRole, "dashboard", "read")) {
    routes.push({ path: "/dashboard", name: "Dashboard" })
  }

  if (hasPermission(userRole, "warehouses", "read")) {
    routes.push({ path: "/warehouses", name: "Warehouses" })
  }

  if (hasPermission(userRole, "inventory", "read")) {
    routes.push({ path: "/inventory", name: "Inventory" })
  }

  if (hasPermission(userRole, "transfers", "read")) {
    routes.push({ path: "/transfers", name: "Transfers" })
  }

  if (hasPermission(userRole, "audits", "read")) {
    routes.push({ path: "/audit", name: "Audits" })
  }

  if (hasPermission(userRole, "users", "read")) {
    routes.push({ path: "/users", name: "Users" })
  }

  if (hasPermission(userRole, "reports", "read")) {
    routes.push({ path: "/reports", name: "Reports" })
  }

  if (hasPermission(userRole, "settings", "read")) {
    routes.push({ path: "/settings", name: "Settings" })
  }

  return routes
}
