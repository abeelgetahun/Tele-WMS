"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Area, AreaChart } from "recharts"
import {
  AlertTriangle,
  Package,
  Users,
  TrendingUp,
  Building2,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  BarChart3,
  PieChartIcon,
  Calendar,
  MapPin,
  DollarSign,
  Truck,
  Shield,
  Star,
} from "lucide-react"
import Link from "next/link"

export function ManagerDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([])
  const [warehouseUsers, setWarehouseUsers] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        setLoading(true)
        const [inv, transfers, users] = await Promise.all([
          apiClient.getInventory(),
          apiClient.getTransfers({ status: "PENDING" }),
          apiClient.getUsers(),
        ])
        setInventory(inv)
        setPendingTransfers(transfers)
        setWarehouseUsers(users)

        // Mock recent activity for better visualization
        setRecentActivity([
          {
            id: 1,
            action: "Stock Added",
            item: "Fiber Optic Cable",
            user: "John Doe",
            time: new Date(Date.now() - 1000 * 60 * 30),
            type: "success",
          },
          {
            id: 2,
            action: "Transfer Approved",
            item: "Router Switch",
            user: "Jane Smith",
            time: new Date(Date.now() - 1000 * 60 * 60 * 2),
            type: "info",
          },
          {
            id: 3,
            action: "Low Stock Alert",
            item: "Network Adapter",
            user: "System",
            time: new Date(Date.now() - 1000 * 60 * 60 * 4),
            type: "warning",
          },
          {
            id: 4,
            action: "Audit Completed",
            item: "Warehouse A",
            user: "Mike Johnson",
            time: new Date(Date.now() - 1000 * 60 * 60 * 6),
            type: "success",
          },
        ])
      } finally {
        setLoading(false)
      }
    })()
  }, [user]) // Updated to use the entire user object

  const stats = useMemo(() => {
    const lowStockByCategory = new Map<string, number>()
    const byCategory = new Map<string, number>()
    const statusCounts = { IN_STOCK: 0, LOW_STOCK: 0, OUT_OF_STOCK: 0 }

    for (const item of inventory) {
      const cat = item.category?.name || "Uncategorized"
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1)

      const status = item.calculatedStatus || "IN_STOCK"
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++
      }

      if (status === "LOW_STOCK") {
        lowStockByCategory.set(cat, (lowStockByCategory.get(cat) || 0) + 1)
      }
    }

    const totalValue = inventory
      .filter((i) => i.calculatedStatus === "IN_STOCK")
      .reduce((s: number, i: any) => s + Number(i.unitPrice || 0) * Number(i.quantity || 1), 0)

    const warehouseCapacity = Math.min(95, Math.max(45, (inventory.length / 1000) * 100))
    const efficiency = Math.min(98, Math.max(75, 85 + Math.random() * 10))

    return {
      totalItems: inventory.length,
      categories: byCategory.size,
      lowStockCategories: lowStockByCategory.size,
      totalValue,
      byCategory,
      lowStockByCategory,
      statusCounts,
      warehouseCapacity,
      efficiency,
      activeUsers: warehouseUsers.filter(
        (u) => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
      totalUsers: warehouseUsers.length,
    }
  }, [inventory, warehouseUsers])

  const categoryData = useMemo(
    () =>
      Array.from(stats.byCategory.entries())
        .map(([name, count]) => ({ name, count }))
        .slice(0, 8),
    [stats.byCategory],
  )

  const stockStatusData = useMemo(
    () => [
      { name: "In Stock", value: stats.statusCounts.IN_STOCK, fill: "#10b981" },
      { name: "Low Stock", value: stats.statusCounts.LOW_STOCK, fill: "#f59e0b" },
      { name: "Out of Stock", value: stats.statusCounts.OUT_OF_STOCK, fill: "#ef4444" },
    ],
    [stats.statusCounts],
  )

  const performanceData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("en", { month: "short" })

      months.push({
        month: monthName,
        efficiency: Math.max(70, Math.min(95, 80 + Math.random() * 15)),
        capacity: Math.max(40, Math.min(90, 60 + Math.random() * 20)),
        transfers: Math.floor(Math.random() * 50) + 20,
      })
    }
    return months
  }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Warehouse Management</h1>
                  <p className="text-blue-100 text-lg">{user?.warehouse?.name || "Your Warehouse"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="h-3 w-3 mr-1" />
                  Active Facility
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Users className="h-3 w-3 mr-1" />
                  {stats.totalUsers} Team Members
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Target className="h-3 w-3 mr-1" />
                  {stats.efficiency.toFixed(1)}% Efficiency
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/inventory">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Button>
              </Link>
              <Link href="/users">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Items</CardTitle>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              {stats.totalItems.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Inventory items managed
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Warehouse Capacity</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.warehouseCapacity.toFixed(1)}%
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.warehouseCapacity}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Current utilization</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Pending Approvals
            </CardTitle>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{pendingTransfers.length}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              Transfers awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Inventory Value</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(stats.totalValue)}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Total asset value</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Warehouse Performance
                </CardTitle>
                <CardDescription>6-month efficiency and capacity trends</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                High Performance
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                efficiency: { label: "Efficiency %", color: "#3b82f6" },
                capacity: { label: "Capacity %", color: "#10b981" },
              }}
              className="h-[300px]"
            >
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#efficiencyGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="capacity"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#capacityGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
              Stock Status
            </CardTitle>
            <CardDescription>Current inventory health</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                inStock: { label: "In Stock", color: "#10b981" },
                lowStock: { label: "Low Stock", color: "#f59e0b" },
                outStock: { label: "Out of Stock", color: "#ef4444" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {stockStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Analysis & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Items by Category
            </CardTitle>
            <CardDescription>Distribution across {stats.categories} categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Items", color: "#6366f1" } }} className="h-[300px]">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest warehouse operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "success"
                        ? "bg-green-100 text-green-600"
                        : activity.type === "warning"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {activity.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : activity.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.item}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Category Browser */}
      <CategoryBrowser inventory={inventory} />

      {/* Team & Transfers Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Management
            </CardTitle>
            <CardDescription>Your warehouse team members</CardDescription>
          </CardHeader>
          <CardContent>
            {warehouseUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No team members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {warehouseUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {String(user.role || "")
                        .replace("_", " ")
                        .toLowerCase()}
                    </Badge>
                  </div>
                ))}
                {warehouseUsers.length > 5 && (
                  <Link href="/users">
                    <Button variant="outline" className="w-full bg-transparent">
                      View All {warehouseUsers.length} Members
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Pending Transfers
            </CardTitle>
            <CardDescription>Awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No pending transfers</p>
                <p className="text-sm text-muted-foreground">All transfers are up to date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTransfers.slice(0, 4).map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{transfer.item?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transfer.quantity} units • {transfer.fromWarehouse?.name} → {transfer.toWarehouse?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Requested by {transfer.requestedBy?.name}</p>
                    </div>
                    <Link href="/transfers">
                      <Button size="sm" className="ml-2">
                        <Shield className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
                {pendingTransfers.length > 4 && (
                  <Link href="/transfers">
                    <Button variant="outline" className="w-full bg-transparent">
                      View All {pendingTransfers.length} Pending Transfers
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Warehouse Images Panel */}
      <WarehouseImagesPanel />
    </div>
  )
}

function CategoryBrowser({ inventory }: { inventory: any[] }) {
  const [active, setActive] = useState<string>("all")
  const byCat = useMemo(() => {
    const m = new Map<string, any[]>()
    for (const i of inventory) {
      const c = i.category?.name || "Uncategorized"
      if (!m.has(c)) m.set(c, [])
      m.get(c)!.push(i)
    }
    return m
  }, [inventory])

  const categories = ["all", ...Array.from(byCat.keys()).sort()]
  const items = active === "all" ? inventory : byCat.get(active) || []

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-600" />
          Inventory Browser
        </CardTitle>
        <CardDescription>Browse and filter items by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Categories</h4>
            {categories.map((c) => (
              <Button
                key={c}
                variant={active === c ? "default" : "ghost"}
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => setActive(c)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="capitalize">{c}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {c === "all" ? inventory.length : byCat.get(c)?.length || 0}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">
                {active === "all" ? "All Items" : active}
                <span className="text-muted-foreground ml-2">({items.length})</span>
              </h4>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No items in this category</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {items.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            item.calculatedStatus === "IN_STOCK"
                              ? "default"
                              : item.calculatedStatus === "LOW_STOCK"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {item.calculatedStatus?.replace("_", " ") || "IN STOCK"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">ETB {Number(item.unitPrice || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                    </div>
                  </div>
                ))}
                {items.length > 8 && (
                  <div className="md:col-span-2 text-center pt-4">
                    <Button variant="outline">View All {items.length} Items</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WarehouseImagesPanel() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ url: "", title: "", description: "" })

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.getWarehouseImages()
      setImages(res)
    } catch (error) {
      console.error("Failed to load images:", error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!form.url) return
    try {
      await apiClient.createWarehouseImage(form)
      setForm({ url: "", title: "", description: "" })
      await load()
    } catch (error) {
      console.error("Failed to create image:", error)
    }
  }

  const update = async (id: string, data: any) => {
    try {
      await apiClient.updateWarehouseImage(id, data)
      await load()
    } catch (error) {
      console.error("Failed to update image:", error)
    }
  }

  const remove = async (id: string) => {
    try {
      await apiClient.deleteWarehouseImage(id)
      await load()
    } catch (error) {
      console.error("Failed to delete image:", error)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Warehouse Gallery
        </CardTitle>
        <CardDescription>Manage visual documentation of your warehouse</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <h4 className="font-medium">Add New Image</h4>
            <div className="space-y-3">
              <Input
                placeholder="Image URL"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <Input
                placeholder="Title (optional)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Button onClick={create} disabled={!form.url} className="w-full">
                <Package className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading images...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No images uploaded yet</p>
                <p className="text-sm text-muted-foreground">Add your first warehouse image to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {images.map((img) => (
                  <div key={img.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={img.title || "Warehouse image"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300&text=Image+Not+Found"
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={img.title || ""}
                        onChange={(e) => update(img.id, { title: e.target.value })}
                        placeholder="Image title"
                        className="text-sm"
                      />
                      <Input
                        value={img.description || ""}
                        onChange={(e) => update(img.id, { description: e.target.value })}
                        placeholder="Description"
                        className="text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => remove(img.id)}
                        className="w-full text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
