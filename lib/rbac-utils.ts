import { type UserRole, ROLE_DEFINITIONS, hasPermission, canAccessWarehouse } from "./permissions"

export interface UserPermissions {
  canManageUsers: boolean
  canManageWarehouses: boolean
  canManageInventory: boolean
  canManageTransfers: boolean
  canApproveTransfers: boolean
  canManageAudits: boolean
  canGenerateReports: boolean
  canAccessSettings: boolean
  isWarehouseScoped: boolean
  accessibleWarehouses: string[]
}

export function getUserPermissions(
  userRole: UserRole,
  userWarehouseId?: string,
  accessibleWarehouseIds: string[] = []
): UserPermissions {
  const roleDef = ROLE_DEFINITIONS[userRole]
  
  return {
    canManageUsers: hasPermission(userRole, "users", "create"),
    canManageWarehouses: hasPermission(userRole, "warehouses", "create"),
    canManageInventory: hasPermission(userRole, "inventory", "create"),
    canManageTransfers: hasPermission(userRole, "transfers", "create"),
    canApproveTransfers: hasPermission(userRole, "transfers", "approve"),
    canManageAudits: hasPermission(userRole, "audits", "create"),
    canGenerateReports: hasPermission(userRole, "reports", "create"),
    canAccessSettings: hasPermission(userRole, "settings", "read"),
    isWarehouseScoped: roleDef?.warehouseScoped || false,
    accessibleWarehouses: userWarehouseId ? [userWarehouseId] : accessibleWarehouseIds,
  }
}

export function canPerformAction(
  userRole: UserRole,
  action: string,
  resource: string,
  userWarehouseId?: string,
  targetWarehouseId?: string
): boolean {
  return hasPermission(userRole, resource, action, userWarehouseId, targetWarehouseId)
}

export function getRoleHierarchy(): Record<UserRole, number> {
  return {
    ADMIN: 5,
    WAREHOUSE_MANAGER: 4,
    INVENTORY_CLERK: 3,
    TECHNICIAN: 2,
    AUDITOR: 1,
  }
}

export function canManageRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy = getRoleHierarchy()
  const currentLevel = hierarchy[currentUserRole] || 0
  const targetLevel = hierarchy[targetRole] || 0
  
  // Users can only manage roles at or below their level
  return currentLevel > targetLevel
}

export function getManageableRoles(userRole: UserRole): UserRole[] {
  const hierarchy = getRoleHierarchy()
  const userLevel = hierarchy[userRole] || 0
  
  return Object.entries(hierarchy)
    .filter(([_, level]) => level < userLevel)
    .map(([role]) => role as UserRole)
}

export function validateWarehouseAccess(
  userRole: UserRole,
  userWarehouseId?: string,
  targetWarehouseId?: string
): { hasAccess: boolean; reason?: string } {
  if (!targetWarehouseId) {
    return { hasAccess: true }
  }

  if (canAccessWarehouse(userRole, userWarehouseId, targetWarehouseId)) {
    return { hasAccess: true }
  }

  return {
    hasAccess: false,
    reason: userRole === "ADMIN" || userRole === "AUDITOR" || userRole === "TECHNICIAN"
      ? "Access denied"
      : "You can only access your assigned warehouse",
  }
}

export function getResourceAccessLevel(userRole: UserRole, resource: string): "none" | "read" | "write" | "admin" {
  const roleDef = ROLE_DEFINITIONS[userRole]
  if (!roleDef) return "none"

  const permission = roleDef.permissions.find((p) => p.resource === resource)
  if (!permission) return "none"

  if (permission.actions.includes("delete")) return "admin"
  if (permission.actions.includes("create") || permission.actions.includes("update")) return "write"
  if (permission.actions.includes("read")) return "read"
  
  return "none"
}

export function getActionableResources(userRole: UserRole): string[] {
  const roleDef = ROLE_DEFINITIONS[userRole]
  if (!roleDef) return []

  return roleDef.permissions
    .filter((p) => p.actions.some((action) => ["create", "update", "delete"].includes(action)))
    .map((p) => p.resource)
}

export function getReadableResources(userRole: UserRole): string[] {
  const roleDef = ROLE_DEFINITIONS[userRole]
  if (!roleDef) return []

  return roleDef.permissions
    .filter((p) => p.actions.includes("read"))
    .map((p) => p.resource)
}

export function formatPermissionError(
  userRole: UserRole,
  resource: string,
  action: string,
  warehouseId?: string
): string {
  const roleName = ROLE_DEFINITIONS[userRole]?.name || userRole
  const baseMessage = `${roleName} cannot ${action} ${resource}`
  
  if (warehouseId && ROLE_DEFINITIONS[userRole]?.warehouseScoped) {
    return `${baseMessage} outside their assigned warehouse`
  }
  
  return baseMessage
}
