"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { hasPermission } from "@/lib/permissions"
import { apiClient } from "@/lib/api-client"
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Folder, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface InventoryItem {
  id: string
  name: string
  description?: string
  sku: string
  quantity: number
  unitPrice: number
  supplier?: string
  category: {
    id: string
    name: string
  }
  warehouse: {
    id: string
    name: string
  }
  calculatedStatus: string
  createdAt: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "category">("table")
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all")
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    unitPrice: "",
    supplier: "",
    categoryId: "",
    warehouseId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [inventoryData, categoriesData, warehousesData] = await Promise.all([
        apiClient.getInventory(),
        apiClient.getCategories(),
        apiClient.getWarehouses(),
      ])

      setItems(inventoryData)
      setCategories(categoriesData)
      setWarehouses(warehousesData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      await apiClient.deleteInventoryItem(id)
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const openEdit = (item: InventoryItem) => {
    setEditing(item)
    setEditForm({
      name: item.name,
      description: item.description || "",
      sku: item.sku,
      barcode: "",
      unitPrice: String(item.unitPrice),
      supplier: item.supplier || "",
      categoryId: item.category.id,
      warehouseId: item.warehouse.id,
    })
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (!editing) return
    try {
      await apiClient.updateInventoryItem(editing.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        sku: editForm.sku,
        barcode: editForm.barcode || undefined,
        unitPrice: Number(editForm.unitPrice),
        supplier: editForm.supplier || undefined,
        categoryId: editForm.categoryId,
        warehouseId: editForm.warehouseId,
      })
      toast({ title: "Item updated" })
      setEditOpen(false)
      setEditing(null)
      fetchData()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update item", variant: "destructive" })
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || item.category.id === categoryFilter
    const matchesWarehouse = warehouseFilter === "all" || item.warehouse.id === warehouseFilter
    const matchesStatus = statusFilter === "all" || item.calculatedStatus === statusFilter

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus
  })

  // Base filtered list that ignores the UI category dropdown; used for Category view and counts
  const baseFilteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesWarehouse = warehouseFilter === "all" || item.warehouse.id === warehouseFilter
    const matchesStatus = statusFilter === "all" || item.calculatedStatus === statusFilter

    return matchesSearch && matchesWarehouse && matchesStatus
  })

  const getStatusBadge = (status: string, quantity: number) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon?: React.ReactNode }> = {
      IN_STOCK: { variant: "default" },
      LOW_STOCK: { variant: "secondary", icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
      OUT_OF_STOCK: { variant: "destructive", icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
    }

    const config = variants[status] || { variant: "secondary" }
    const displayStatus = status.replace("_", " ")

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {displayStatus}
      </Badge>
    )
  }

  const getStockStats = (source: InventoryItem[]) => {
    return {
      total: source.length,
      inStock: source.filter((item) => item.calculatedStatus === "IN_STOCK").length,
      lowStock: source.filter((item) => item.calculatedStatus === "LOW_STOCK").length,
      outOfStock: source.filter((item) => item.calculatedStatus === "OUT_OF_STOCK").length,
      // Actual inventory value: sum unitPrice of items that are currently IN_STOCK within the filtered source
      totalValue: source
        .filter((item) => item.calculatedStatus === "IN_STOCK")
        .reduce((sum, item) => sum + (Number(item.unitPrice) || 0), 0),
    }
  }

  // In table view, stats reflect the dropdown filters; in category view, stats reflect the active category selection
  const stats = viewMode === "table" ? getStockStats(filteredItems) : getStockStats(activeCategoryId === "all" ? baseFilteredItems : baseFilteredItems.filter((i) => i.category.id === activeCategoryId))

  const categoriesWithCounts = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
    // Counts should respect current search/warehouse/status filters
    count: baseFilteredItems.filter((i) => i.category.id === c.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const itemsInActiveCategory = activeCategoryId === "all" ? baseFilteredItems : baseFilteredItems.filter((i) => i.category.id === activeCategoryId)

  const lowStockCategoryCount = categoriesWithCounts.filter((c) => c.count > 0 && c.count < 10).length
  const outOfStockCategoryCount = categoriesWithCounts.filter((c) => c.count === 0).length

  if (loading) {
    return (
      <ProtectedRoute resource="inventory" action="read">
        <MainLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute resource="inventory" action="read">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
              <p className="text-muted-foreground">Track and manage inventory items across warehouses</p>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="category">Category</TabsTrigger>
                </TabsList>
              </Tabs>
              {hasPermission(user?.role!, "inventory", "create") && (
                <Link href="/inventory/add">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 overflow-hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Inventory items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                <Package className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
                <p className="text-xs text-muted-foreground">Available items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
                <p className="text-xs text-muted-foreground">Need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                <p className="text-xs text-muted-foreground">Urgent attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
        <div className="text-2xl font-bold truncate" title={new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(stats.totalValue)}>
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                    minimumFractionDigits: 0,
                  }).format(stats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">Inventory value</p>
              </CardContent>
            </Card>
          </div>

      {/* Category Summary (for all users) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low-stock Categories</CardTitle>
            <CardDescription>Categories with 1-9 items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categoriesWithCounts.filter((c) => c.count > 0 && c.count < 10).slice(0, 12).map((c) => (
                <Button key={c.id} variant="outline" size="sm" onClick={() => setActiveCategoryId(c.id)} className="justify-start">
                  <AlertTriangle className="h-3 w-3 text-orange-500 mr-2" /> {c.name}
                  <Badge variant="secondary" className="ml-2">{c.count}</Badge>
                </Button>
              ))}
              {lowStockCategoryCount === 0 && <p className="text-sm text-muted-foreground">None</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out-of-stock Categories</CardTitle>
            <CardDescription>No items in category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categoriesWithCounts.filter((c) => c.count === 0).slice(0, 12).map((c) => (
                <Button key={c.id} variant="outline" size="sm" onClick={() => setActiveCategoryId(c.id)} className="justify-start">
                  <AlertTriangle className="h-3 w-3 text-red-500 mr-2" /> {c.name}
                  <Badge variant="destructive" className="ml-2">0</Badge>
                </Button>
              ))}
              {outOfStockCategoryCount === 0 && <p className="text-sm text-muted-foreground">None</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Views */}
          {viewMode === "table" ? (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>
                  Showing {filteredItems.length} of {items.length} items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>SKU Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                              {item.supplier && (
                                <div className="text-xs text-muted-foreground">Supplier: {item.supplier}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category.name}</Badge>
                          </TableCell>
                          <TableCell>{item.warehouse.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Unit</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.calculatedStatus, 1)}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(item.unitPrice)}
                          </TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {hasPermission(user?.role!, "inventory", "update") && (
                                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission(user?.role!, "inventory", "delete") && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Select a category to view items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <Button variant={activeCategoryId === "all" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveCategoryId("all")}>
                      <Folder className="h-4 w-4 mr-2" /> All Categories
                      <span className="ml-auto text-xs text-muted-foreground">{baseFilteredItems.length}</span>
                    </Button>
                    {categoriesWithCounts.map((c) => {
                      const isOut = c.count === 0
                      const isLow = c.count > 0 && c.count < 10
                      return (
                        <Button
                          key={c.id}
                          variant={activeCategoryId === c.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setActiveCategoryId(c.id)}
                        >
                          <Folder className="h-4 w-4 mr-2" /> {c.name}
                          {isOut ? (
                            <Badge variant="destructive" className="ml-auto">0</Badge>
                          ) : (
                            <Badge variant={isLow ? "secondary" : "outline"} className="ml-auto">{c.count}</Badge>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {activeCategoryId === "all"
                      ? "All Items"
                      : categories.find((c) => c.id === activeCategoryId)?.name || "Items"}
                  </CardTitle>
                  <CardDescription>Showing {itemsInActiveCategory.length} item(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsInActiveCategory.length === 0 ? (
                    <p className="text-muted-foreground">No items in this category.</p>
                  ) : (
                    <div className="space-y-2">
                      {itemsInActiveCategory.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border rounded-md p-3">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{item.warehouse.name}</Badge>
                            <Badge variant="outline">ETB {item.unitPrice}</Badge>
                            {hasPermission(user?.role!, "inventory", "update") && (
                              <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Item</DialogTitle>
                <DialogDescription>Update item details. SKU is unique per unit.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <div className="flex gap-2">
                    <Input id="sku" value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} placeholder="Auto or custom" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const findCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name as string | undefined
                        const findWarehouseName = (id?: string) => warehouses.find((w: any) => w.id === id)?.name as string | undefined
                        const generateSku = (categoryName?: string, warehouseName?: string) => {
                          const norm = (s?: string, len = 3) => (s || "").replace(/[^A-Za-z0-9]/g, "").slice(0, len).toUpperCase().padEnd(len, "X")
                          const cat = norm(categoryName || "GEN", 3)
                          const wh = warehouseName ? norm(warehouseName, 3) : ""
                          const ts = Date.now().toString().slice(-4)
                          const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 6)
                          return [cat, wh, ts, rand].filter(Boolean).join("-")
                        }
                        const newSku = generateSku(findCategoryName(editForm.categoryId), findWarehouseName(editForm.warehouseId))
                        setEditForm({ ...editForm, sku: newSku })
                        toast({ title: "SKU generated", description: newSku })
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input id="unitPrice" type="number" step="0.01" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input id="supplier" value={editForm.supplier} onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Select value={editForm.warehouseId} onValueChange={(v) => setEditForm({ ...editForm, warehouseId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={submitEdit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
