import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "./auth"
import { hasPermission, canAccessWarehouse, type UserRole } from "./permissions"
import { prisma } from "./prisma"

export interface AuthenticatedRequest extends NextRequest {
  user: {
    userId: string
    email: string
    role: UserRole
    warehouseId?: string
  }
}

export function withAuth(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      const token = request.headers.get("authorization")?.replace("Bearer ", "")

      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Handle manual tokens (for development/testing)
  if (token.startsWith("manual-token-")) {
        // For manual tokens, we need to get user data from the client side
        // Since we can't access localStorage in middleware, we'll need a different approach
        // For now, let's create a simple user object based on the token
        const userId = token.replace("manual-token-", "")
        
        // Create a basic user object for manual tokens
        const manualUser = {
          userId: userId,
          email: `${userId.split('-')[0]}@ethiotelecom.et`,
          role: userId.includes('admin') ? "ADMIN" : 
                userId.includes('manager') ? "WAREHOUSE_MANAGER" :
                userId.includes('clerk') ? "INVENTORY_CLERK" :
                userId.includes('technician') ? "TECHNICIAN" :
                userId.includes('auditor') ? "AUDITOR" : "INVENTORY_CLERK",
          warehouseId: userId.includes('manager') ? "warehouse-1" :
                     userId.includes('clerk') ? "warehouse-2" : undefined,
        } as any

        // Best-effort map to a real warehouse in dev so scoped queries work
        try {
          if (!manualUser.warehouseId && (manualUser.role === "WAREHOUSE_MANAGER" || manualUser.role === "INVENTORY_CLERK")) {
            const firstWarehouse = await prisma.warehouse.findFirst({ select: { id: true } })
            if (firstWarehouse) {
              manualUser.warehouseId = firstWarehouse.id as any
            }
          }
        } catch {
          // ignore mapping errors in dev
        }

        // Add user info to request
        const requestWithUser = request as AuthenticatedRequest
        requestWithUser.user = manualUser

        return handler(requestWithUser, context)
      }

      // Handle JWT tokens
      const payload = verifyJWT(token)
      if (!payload) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }

      // Get user details from database to ensure we have the latest role and warehouse info
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          warehouseId: true,
          isActive: true,
        },
      })

      if (!user || !user.isActive) {
        return NextResponse.json({ error: "User not found or inactive" }, { status: 401 })
      }

      // Add user info to request
      const requestWithUser = request as AuthenticatedRequest
      requestWithUser.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        warehouseId: user.warehouseId || undefined,
      }

      return handler(requestWithUser, context)
    } catch (error) {
      console.error("Authentication error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}

export function withAuthorization(
  resource: string,
  action: string,
  handler: Function,
  options?: {
    requireWarehouseAccess?: boolean
    warehouseIdExtractor?: (request: AuthenticatedRequest) => string | undefined
  }
) {
  return withAuth(async (request: AuthenticatedRequest, context?: any) => {
    try {
      const { user } = request

      // Check basic permission
      let targetWarehouseId: string | undefined
      
      if (options?.warehouseIdExtractor) {
        targetWarehouseId = options.warehouseIdExtractor(request)
      } else if (options?.requireWarehouseAccess) {
        // For warehouse access, we'll let the handler deal with body parsing
        // and just check basic permissions here
        targetWarehouseId = undefined
      }

      // Check permission with warehouse scope
      if (!hasPermission(user.role, resource, action, user.warehouseId, targetWarehouseId)) {
        return NextResponse.json(
          { error: "Insufficient permissions for this action" },
          { status: 403 }
        )
      }

      // If warehouse access is required, check warehouse access
      if (options?.requireWarehouseAccess && targetWarehouseId) {
        if (!canAccessWarehouse(user.role, user.warehouseId, targetWarehouseId)) {
          return NextResponse.json(
            { error: "Access denied to this warehouse" },
            { status: 403 }
          )
        }
      }

      return handler(request, context)
    } catch (error) {
      console.error("Authorization error:", error)
      return NextResponse.json({ error: "Authorization failed" }, { status: 500 })
    }
  })
}

// Convenience functions for common authorization patterns
export function withUserManagement(handler: Function) {
  return withAuthorization("users", "create", handler)
}

export function withInventoryManagement(handler: Function) {
  return withAuthorization("inventory", "create", handler, { requireWarehouseAccess: true })
}

export function withTransferManagement(handler: Function) {
  return withAuthorization("transfers", "create", handler, { requireWarehouseAccess: true })
}

export function withWarehouseManagement(handler: Function) {
  return withAuthorization("warehouses", "create", handler)
}

export function withAuditManagement(handler: Function) {
  return withAuthorization("audits", "create", handler)
}

export function withReportAccess(handler: Function) {
  return withAuthorization("reports", "read", handler)
}

// Read-only authorization helpers
export function withReadAccess(resource: string, handler: Function) {
  return withAuthorization(resource, "read", handler)
}

export function withWriteAccess(resource: string, handler: Function) {
  return withAuthorization(resource, "create", handler)
}

export function withUpdateAccess(resource: string, handler: Function) {
  return withAuthorization(resource, "update", handler)
}

export function withDeleteAccess(resource: string, handler: Function) {
  return withAuthorization(resource, "delete", handler)
}
