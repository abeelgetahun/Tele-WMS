"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { getAccessibleRoutes } from "@/lib/permissions"
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
  Dashboard: LayoutDashboard,
  Warehouses: Building2,
  Inventory: Package,
  Transfers: ArrowLeftRight,
  Audits: ClipboardCheck,
  Users: Users,
  Reports: BarChart3,
  Settings: Settings,
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const accessibleRoutes = getAccessibleRoutes(user.role)

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-4">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">TWMS</h2>
            <div className="px-4 text-sm text-muted-foreground">
              {user.name} ({user.role.replace("_", " ")})
            </div>
          </div>
          <div className="space-y-1">
            {accessibleRoutes.map((route) => {
              const Icon = iconMap[route.name as keyof typeof iconMap]
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
        </div>
      </div>
    </div>
  )
}
