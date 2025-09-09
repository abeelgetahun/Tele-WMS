"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { getAccessibleRoutes, getRoleDisplayName } from "@/lib/permissions"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Package,
  ArrowLeftRight,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
  UserIcon,
  Plus,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  MapPin,
  Clock,
  Shield,
  Truck,
  Target,
  Activity,
  Calendar,
  Download,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

const iconMap = {
  LayoutDashboard: LayoutDashboard,
  Building2: Building2,
  Package: Package,
  ArrowLeftRight: ArrowLeftRight,
  ClipboardCheck: ClipboardCheck,
  Users: Users,
  BarChart3: BarChart3,
  Settings: Settings,
  User: UserIcon,
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [teamCount, setTeamCount] = useState(0)

  useEffect(() => {
    if (!user) return
    if (user.role === "WAREHOUSE_MANAGER") {
      fetchManagerStats(user.warehouseId)
    }
  }, [user])

  const fetchManagerStats = async (warehouseId?: string) => {
    try {
      const [transfers, inventory, users] = await Promise.all([
        apiClient.getTransfers({ status: "PENDING" }),
        apiClient.getInventory(),
        apiClient.getUsers(),
      ])

      setPendingCount(Array.isArray(transfers) ? transfers.length : 0)
      setLowStockCount(
        Array.isArray(inventory) ? inventory.filter((item) => item.calculatedStatus === "LOW_STOCK").length : 0,
      )
  setTeamCount(Array.isArray(users) ? users.filter((u) => u.warehouseId === warehouseId).length : 0)
    } catch (error) {
      console.error("Failed to fetch manager stats:", error)
    }
  }

  if (!user) return null

  const accessibleRoutes = getAccessibleRoutes(user.role)

  return (
    <div className="pb-12 w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 h-full overflow-y-auto">
      <div className="space-y-4 py-4">
        {/* Mobile close button */}
        <div className="flex justify-end px-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header Section */}
        <div className="px-3 py-2">
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">TWMS</h2>
                <p className="text-xs opacity-90">Warehouse Management</p>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs opacity-90">{getRoleDisplayName(user.role)}</div>
              {user.warehouse && (
                <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.warehouse.name}
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <div className="space-y-1 mb-6">
            <div className="px-2 py-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">Navigation</div>
            {accessibleRoutes.map((route) => {
              const Icon = iconMap[route.icon as keyof typeof iconMap] || LayoutDashboard
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  onClick={() => onClose?.()}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm",
                    pathname === route.path
                      ? "bg-blue-100 text-blue-700 shadow-sm border-l-4 border-blue-600"
                      : "text-slate-700",
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {route.name}
                </Link>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Manager-Specific Quick Actions */}
          {user.role === "WAREHOUSE_MANAGER" && (
            <>
              <div className="space-y-1 mb-6">
                <div className="px-2 py-1 text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Manager Tools
                </div>

                {/* Pending Approvals */}
                <Link
                  href="/transfers"
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-orange-50 hover:text-orange-700",
                    pathname === "/transfers" ? "bg-orange-100 text-orange-700" : "text-slate-700",
                  )}
                >
                  <div className="flex items-center">
                    <CheckCircle className="mr-3 h-4 w-4" />
                    Approve Transfers
                  </div>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </Link>

                {/* Team Management */}
                <Link
                  href="/users"
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-green-50 hover:text-green-700",
                    pathname === "/users" ? "bg-green-100 text-green-700" : "text-slate-700",
                  )}
                >
                  <div className="flex items-center">
                    <Users className="mr-3 h-4 w-4" />
                    Manage Team
                  </div>
                  <Badge variant="outline" className="h-5 text-xs">
                    {teamCount}
                  </Badge>
                </Link>

                {/* Stock Alerts */}
                <Link
                  href="/inventory"
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-yellow-50 hover:text-yellow-700",
                    pathname === "/inventory" ? "bg-yellow-100 text-yellow-700" : "text-slate-700",
                  )}
                >
                  <div className="flex items-center">
                    <AlertTriangle className="mr-3 h-4 w-4" />
                    Stock Alerts
                  </div>
                  {lowStockCount > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs bg-yellow-100 text-yellow-800">
                      {lowStockCount}
                    </Badge>
                  )}
                </Link>

                {/* Warehouse Analytics */}
                <Link
                  href="/reports"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-purple-50 hover:text-purple-700",
                    pathname === "/reports" ? "bg-purple-100 text-purple-700" : "text-slate-700",
                  )}
                >
                  <TrendingUp className="mr-3 h-4 w-4" />
                  Analytics & Reports
                </Link>

                {/* Audit Management */}
                <Link
                  href="/audit"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-indigo-50 hover:text-indigo-700",
                    pathname === "/audit" ? "bg-indigo-100 text-indigo-700" : "text-slate-700",
                  )}
                >
                  <ClipboardCheck className="mr-3 h-4 w-4" />
                  Schedule Audits
                </Link>
              </div>

              <Separator className="my-4" />

              {/* Warehouse Operations */}
              <div className="space-y-1 mb-6">
                <div className="px-2 py-1 text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  Operations
                </div>

                {/* Quick Add Inventory */}
                <Link
                  href="/inventory/add"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  Add New Item
                </Link>

                {/* Warehouse Layout */}
                <Link
                  href="/warehouses"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-all duration-200"
                >
                  <MapPin className="mr-3 h-4 w-4" />
                  Warehouse Layout
                </Link>

                {/* Activity Log */}
                <Link
                  href="/activity"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200"
                >
                  <Clock className="mr-3 h-4 w-4" />
                  Activity Log
                </Link>

                {/* Document Management */}
                <Link
                  href="/documents"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                >
                  <FileText className="mr-3 h-4 w-4" />
                  Documents
                </Link>
              </div>

              <Separator className="my-4" />

              {/* Quick Stats Card */}
              <div className="mx-2 p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border">
                <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Today's Overview
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Pending Tasks</span>
                    <Badge variant="outline" className="h-4 text-xs">
                      {pendingCount}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Team Members</span>
                    <Badge variant="outline" className="h-4 text-xs">
                      {teamCount}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Low Stock</span>
                    <Badge variant={lowStockCount > 0 ? "destructive" : "outline"} className="h-4 text-xs">
                      {lowStockCount}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* General Quick Actions for Other Roles */}
          {user.role !== "WAREHOUSE_MANAGER" && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Quick Actions
              </div>

              {/* Profile for all users */}
              <Link
                href="/profile"
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-blue-50 hover:text-blue-700",
                  pathname === "/profile" ? "bg-blue-100 text-blue-700" : "text-slate-700",
                )}
              >
                <UserIcon className="mr-3 h-4 w-4" />
                My Profile
              </Link>

              {/* Role-specific actions */}
              {user.role === "INVENTORY_CLERK" && (
                <>
                  <Link
                    href="/inventory/add"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    Add Inventory
                  </Link>
                  <Link
                    href="/inventory"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                  >
                    <Package className="mr-3 h-4 w-4" />
                    Update Stock
                  </Link>
                </>
              )}

              {user.role === "ADMIN" && (
                <>
                  <Link
                    href="/users"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200"
                  >
                    <Users className="mr-3 h-4 w-4" />
                    Manage Users
                  </Link>
                  <Link
                    href="/warehouses"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200"
                  >
                    <Building2 className="mr-3 h-4 w-4" />
                    Manage Warehouses
                  </Link>
                </>
              )}

              {user.role === "TECHNICIAN" && (
                <>
                  <Link
                    href="/maintenance"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Maintenance Tasks
                  </Link>
                  <Link
                    href="/equipment"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-200"
                  >
                    <Truck className="mr-3 h-4 w-4" />
                    Equipment Status
                  </Link>
                </>
              )}

              {user.role === "AUDITOR" && (
                <>
                  <Link
                    href="/audit/schedule"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Schedule Audit
                  </Link>
                  <Link
                    href="/audit/reports"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                  >
                    <Download className="mr-3 h-4 w-4" />
                    Audit Reports
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
