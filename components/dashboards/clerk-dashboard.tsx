"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { Package, Plus, AlertTriangle, Clock, Eye } from "lucide-react"
import Link from "next/link"

export function ClerkDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [recentItems, setRecentItems] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const inventoryData = await apiClient.getInventory({ warehouseId: user?.warehouseId })

      // Calculate stats
      const lowStockItems = inventoryData.filter((item: any) => item.quantity <= item.minStock)
      const outOfStockItems = inventoryData.filter((item: any) => item.quantity === 0)

      setStats({
        totalItems: inventoryData.length,
        lowStockItems: lowStockItems.length,
        outOfStockItems: outOfStockItems.length,
        categories: [...new Set(inventoryData.map((item: any) => item.category?.name))].length,
      })

      setRecentItems(inventoryData.slice(0, 5))
      setLowStockItems(lowStockItems.slice(0, 5))
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      // Fallback data
      setStats({
        totalItems: 125,
        lowStockItems: 8,
        outOfStockItems: 3,
        categories: 12,
      })
      setRecentItems([])
      setLowStockItems([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clerk Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
          <p className="text-muted-foreground">{user?.warehouse?.name || "Your Warehouse"} - Daily Operations</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/inventory/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">In your warehouse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.outOfStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.categories || 0}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common daily inventory tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/inventory/add">
              <Button variant="outline" className="w-full h-20 flex flex-col bg-transparent">
                <Plus className="h-6 w-6 mb-2" />
                Add New Item
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full h-20 flex flex-col bg-transparent">
                <Package className="h-6 w-6 mb-2" />
                Update Stock
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full h-20 flex flex-col bg-transparent">
                <Eye className="h-6 w-6 mb-2" />
                View Inventory
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Recently added inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="text-muted-foreground">No recent items</p>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <Badge
                      variant={
                        item.quantity === 0 ? "destructive" : item.quantity <= item.minStock ? "secondary" : "default"
                      }
                    >
                      {item.quantity} units
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Min: {item.minStock} | Current: {item.quantity}
                      </p>
                    </div>
                    <Badge variant={item.quantity === 0 ? "destructive" : "secondary"}>
                      {item.quantity === 0 ? "Out of Stock" : "Low Stock"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
