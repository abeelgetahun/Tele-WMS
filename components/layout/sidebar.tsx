"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { getAccessibleRoutes, getRoleDisplayName, canCreateTransfers, canManageUsers } from "@/lib/permissions"
import {
  Building2,
  Package,
  ArrowLeftRight,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
} from "lucide-react"

const iconMap = {
  LayoutDashboard: LayoutDashboard,
  Building2: Building2,
  Package: Package,
  ArrowLeftRight: ArrowLeftRight,
  ClipboardCheck: ClipboardCheck,
  Users: Users,
  BarChart3: BarChart3,
  Settings: Settings,
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const accessibleRoutes = getAccessibleRoutes(user.role, user.warehouseId)

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-4">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">TWMS</h2>
            <div className="px-4 text-sm text-muted-foreground">
              {user.name} ({getRoleDisplayName(user.role)})
            </div>
            {user.warehouse && (
              <div className="px-4 text-xs text-muted-foreground">
                {user.warehouse.name}
              </div>
            )}
          </div>
          <div className="space-y-1">
            {accessibleRoutes.map((route) => {
              const Icon = iconMap[route.icon as keyof typeof iconMap] || LayoutDashboard
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === route.path ? "bg-accent text-accent-foreground" : "transparent",
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {route.name}
                </Link>
              )
            })}
          </div>
          
          {/* Role-specific quick actions */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="px-4 text-sm font-medium text-muted-foreground mb-2">Quick Actions</h3>
            <div className="space-y-1">
              {/* Manager-specific actions */}
              {user.role === "WAREHOUSE_MANAGER" && (
                <>
                  <Link
                    href="/users"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/users" ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Staff
                  </Link>
                  <Link
                    href="/transfers"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/transfers" ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Approve Transfers
                  </Link>
                </>
              )}
              
              {/* Clerk-specific actions */}
              {user.role === "INVENTORY_CLERK" && (
                <>
                  <Link
                    href="/inventory/add"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/inventory/add" ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add Inventory
                  </Link>
                  <Link
                    href="/inventory"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/inventory" ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Update Stock
                  </Link>
                </>
              )}
              
              {/* Admin-specific actions */}
              {user.role === "ADMIN" && (
                <>
                  <Link
                    href="/users"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/users" ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                  <Link
                    href="/warehouses"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === "/warehouses" ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Warehouses
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
