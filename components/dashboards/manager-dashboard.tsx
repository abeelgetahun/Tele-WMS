"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { AlertTriangle, Package, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export function ManagerDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([])
  const [warehouseUsers, setWarehouseUsers] = useState<any[]>([])

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
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.warehouseId])

  const stats = useMemo(() => {
    const lowStockByCategory = new Map<string, number>()
    const byCategory = new Map<string, number>()
    for (const item of inventory) {
      const cat = item.category?.name || "Uncategorized"
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1)
    }
    for (const [cat, count] of byCategory.entries()) {
      if (count > 0 && count < 10) lowStockByCategory.set(cat, count)
    }
    const totalValue = inventory
      .filter((i) => i.calculatedStatus === "IN_STOCK")
      .reduce((s: number, i: any) => s + Number(i.unitPrice || 0), 0)
    return {
      totalItems: inventory.length,
      categories: byCategory.size,
      lowStockCategories: lowStockByCategory.size,
      totalValue,
      byCategory,
      lowStockByCategory,
    }
  }, [inventory])

  const categoryData = useMemo(
    () => Array.from(stats.byCategory.entries()).map(([name, count]) => ({ name, count })),
    [stats.byCategory]
  )
  const lowCategoryData = useMemo(
    () => Array.from(stats.lowStockByCategory.entries()).map(([name, count]) => ({ name, count })),
    [stats.lowStockByCategory]
  )
  const stockTrend = useMemo(() => {
    const months: Record<string, number> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months[key] = 0
    }
    for (const item of inventory) {
      const d = new Date(item.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (key in months) months[key] += 1
    }
    return Object.entries(months).map(([month, count]) => ({ month, count }))
  }, [inventory])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warehouse Overview</h2>
          <p className="text-sm text-muted-foreground">{user?.warehouse?.name || "Your Warehouse"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory"><Button variant="outline">Manage Inventory</Button></Link>
          <Link href="/users"><Button variant="outline">Manage Users</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Single-unit SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low-stock Categories</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockCategories}</div>
            <p className="text-xs text-muted-foreground">1–9 items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">In-stock items only</p>
          </CardContent>
        </Card>
      </div>

  <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
            <CardDescription>Distribution of items across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Items", color: "hsl(var(--primary))" } }}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide={false} tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low-stock Categories</CardTitle>
            <CardDescription>Categories with fewer than 10 items</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Items", color: "hsl(var(--chart-2))" } }}>
              <BarChart data={lowCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide={false} tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

  {/* Browse Items by Category */}
  <CategoryBrowser inventory={inventory} />

      <Card>
        <CardHeader>
          <CardTitle>Items Added (last 12 months)</CardTitle>
          <CardDescription>Monthly additions to your warehouse</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Items", color: "hsl(var(--chart-3))" } }}>
            <LineChart data={stockTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

  <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users in Warehouse</CardTitle>
            <CardDescription>Clerks and technicians you manage</CardDescription>
          </CardHeader>
          <CardContent>
            {warehouseUsers.length === 0 ? (
              <p className="text-muted-foreground">No users found.</p>
            ) : (
              <div className="space-y-2">
                {warehouseUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{u.name}</span>
                    </div>
                    <Badge variant="outline">{String(u.role || "").replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Transfers</CardTitle>
            <CardDescription>Awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <p className="text-muted-foreground">No pending transfers.</p>
            ) : (
              <div className="space-y-2">
                {pendingTransfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span className="truncate">{t.item?.name} • {t.fromWarehouse?.name} → {t.toWarehouse?.name}</span>
                    <Link href={`/transfers`}><Button size="sm" variant="outline">Review</Button></Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Images CRUD */}
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
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Browse by Category</CardTitle>
          <CardDescription>Filter items by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {categories.map((c) => (
              <Button key={c} variant={active === c ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActive(c)}>
                {c}
                <span className="ml-auto text-xs text-muted-foreground">{c === "all" ? inventory.length : byCat.get(c)?.length || 0}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{active === "all" ? "All Items" : active}</CardTitle>
          <CardDescription>Showing {items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground">No items.</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">SKU: {i.sku}</div>
                  </div>
                  <Badge variant="outline">ETB {i.unitPrice}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    await apiClient.createWarehouseImage(form)
    setForm({ url: "", title: "", description: "" })
    await load()
  }
  const update = async (id: string, data: any) => {
    await apiClient.updateWarehouseImage(id, data)
    await load()
  }
  const remove = async (id: string) => {
    await apiClient.deleteWarehouseImage(id)
    await load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Images</CardTitle>
        <CardDescription>Manage images for your warehouse</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Input placeholder="Image URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <Input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button onClick={create} disabled={!form.url}>Add Image</Button>
          </div>
          <div className="md:col-span-2">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : images.length === 0 ? (
              <p className="text-muted-foreground">No images yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {images.map((img) => (
                  <div key={img.id} className="border rounded-md p-3 space-y-2">
                    <img src={img.url} alt={img.title || "Warehouse image"} className="w-full h-32 object-cover rounded" />
                    <Input value={img.title || ""} onChange={(e) => update(img.id, { title: e.target.value })} placeholder="Title" />
                    <Input value={img.description || ""} onChange={(e) => update(img.id, { description: e.target.value })} placeholder="Description" />
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => remove(img.id)}>Delete</Button>
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
