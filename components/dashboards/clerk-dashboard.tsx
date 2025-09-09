"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { Package, Plus, AlertTriangle, Eye, Folder } from "lucide-react"
import Link from "next/link"

export function ClerkDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [recentItems, setRecentItems] = useState<any[]>([])
  const [categoryGroups, setCategoryGroups] = useState<Array<{ category: string; items: any[] }>>([])
  const [lowStockCategories, setLowStockCategories] = useState<Array<{ category: string; count: number }>>([])
  const [outOfStockCategories, setOutOfStockCategories] = useState<Array<{ category: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const inventoryData = await apiClient.getInventory({ warehouseId: user?.warehouseId })

      // Calculate stats
      // Group by category
      const byCategory = new Map<string, any[]>()
      for (const item of inventoryData) {
        const cat = item.category?.name || "Uncategorized"
        if (!byCategory.has(cat)) byCategory.set(cat, [])
        byCategory.get(cat)!.push(item)
      }

  const groups = Array.from(byCategory.entries()).map(([category, items]) => ({ category, items }))

  // Category-level stock states
  const lowCats = groups.filter((g) => g.items.length > 0 && g.items.length < 10)
  const outCats = groups.filter((g) => g.items.length === 0)

      setStats({
        totalItems: inventoryData.length,
        lowStockCategories: lowCats.length,
        categories: groups.length,
      })

      setCategoryGroups(groups.sort((a, b) => a.category.localeCompare(b.category)))
      setLowStockCategories(lowCats.map((g) => ({ category: g.category, count: g.items.length })))
      setOutOfStockCategories(outCats.map((g) => ({ category: g.category, count: 0 })))
      setRecentItems(inventoryData.slice(0, 5))
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      // Fallback data
  setStats({ totalItems: 0, lowStockCategories: 0, categories: 0 })
  setRecentItems([])
  setCategoryGroups([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <div className="flex items-center justify-end">
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
            <CardTitle className="text-sm font-medium">Low Stock Categories</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.lowStockCategories || 0}</div>
            <p className="text-xs text-muted-foreground">Categories with {'<'} 10 items</p>
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

      {/* Category Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low-stock Categories</CardTitle>
            <CardDescription>Categories with 1-9 items</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockCategories.length === 0 ? (
              <p className="text-muted-foreground">None</p>
            ) : (
              <div className="space-y-2">
                {lowStockCategories.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>{c.category}</span>
                    </div>
                    <Badge variant="secondary">{c.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Out-of-stock Categories</CardTitle>
            <CardDescription>No items available</CardDescription>
          </CardHeader>
          <CardContent>
            {outOfStockCategories.length === 0 ? (
              <p className="text-muted-foreground">None</p>
            ) : (
              <div className="space-y-2">
                {outOfStockCategories.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>{c.category}</span>
                    </div>
                    <Badge variant="destructive">0</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Recently added single-unit SKUs</CardDescription>
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
                    <Badge variant="default">Unit</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Browse items by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryGroups.length === 0 ? (
              <p className="text-muted-foreground">No items</p>
            ) : (
              <div className="space-y-4">
                {categoryGroups.map((group) => {
                  const isLow = group.items.length < 10
                  return (
                    <div key={group.category} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{group.category}</p>
                        </div>
                        <Badge variant={isLow ? "secondary" : "default"}>
                          {group.items.length} items {isLow && "(low)"}
                        </Badge>
                      </div>
                      <div className="mt-2 grid md:grid-cols-2 gap-2">
                        {group.items.slice(0, 6).map((i) => (
                          <div key={i.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{i.name}</span>
                            <span className="text-muted-foreground">{i.sku}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
