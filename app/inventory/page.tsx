"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Download, Edit, Trash2, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"

// Mock inventory data
const inventoryData = [
  {
    id: "INV001",
    name: "Router TP-Link AC1200",
    category: "Network Equipment",
    sku: "TPL-AC1200",
    warehouse: "Addis Ababa Central",
    quantity: 45,
    minStock: 20,
    maxStock: 100,
    unitPrice: 2500,
    supplier: "Tech Solutions Ltd",
    status: "In Stock",
    lastUpdated: "2024-01-15",
  },
  {
    id: "INV002",
    name: "Ethernet Cable Cat6 (100m)",
    category: "Cables",
    sku: "ETH-CAT6-100",
    warehouse: "Dire Dawa Regional",
    quantity: 15,
    minStock: 25,
    maxStock: 200,
    unitPrice: 150,
    supplier: "Cable Corp",
    status: "Low Stock",
    lastUpdated: "2024-01-14",
  },
  {
    id: "INV003",
    name: "SIM Card - Prepaid",
    category: "SIM Cards",
    sku: "SIM-PREP-001",
    warehouse: "Bahir Dar Branch",
    quantity: 500,
    minStock: 100,
    maxStock: 1000,
    unitPrice: 25,
    supplier: "Ethio Telecom",
    status: "In Stock",
    lastUpdated: "2024-01-16",
  },
  {
    id: "INV004",
    name: "Fiber Optic Cable (1km)",
    category: "Cables",
    sku: "FOC-1KM",
    warehouse: "Mekelle Central",
    quantity: 0,
    minStock: 5,
    maxStock: 50,
    unitPrice: 15000,
    supplier: "Fiber Tech",
    status: "Out of Stock",
    lastUpdated: "2024-01-10",
  },
  {
    id: "INV005",
    name: "Wireless Access Point",
    category: "Network Equipment",
    sku: "WAP-001",
    warehouse: "Addis Ababa Central",
    quantity: 32,
    minStock: 15,
    maxStock: 75,
    unitPrice: 3200,
    supplier: "Network Pro",
    status: "In Stock",
    lastUpdated: "2024-01-16",
  },
]

const categories = ["All Categories", "Network Equipment", "Cables", "SIM Cards", "Devices", "Accessories"]
const warehouses = [
  "All Warehouses",
  "Addis Ababa Central",
  "Dire Dawa Regional",
  "Bahir Dar Branch",
  "Mekelle Central",
]

export default function InventoryPage() {
  const [inventory, setInventory] = useState(inventoryData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedWarehouse, setSelectedWarehouse] = useState("All Warehouses")
  const [statusFilter, setStatusFilter] = useState("All Status")

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory
    const matchesWarehouse = selectedWarehouse === "All Warehouses" || item.warehouse === selectedWarehouse
    const matchesStatus = statusFilter === "All Status" || item.status === statusFilter

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus
  })

  const getStatusBadge = (status: string, quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (quantity <= minStock) {
      return <Badge variant="secondary">Low Stock</Badge>
    } else {
      return <Badge variant="default">In Stock</Badge>
    }
  }

  const getStockLevel = (quantity: number, minStock: number, maxStock: number) => {
    const percentage = (quantity / maxStock) * 100
    let color = "bg-green-500"

    if (quantity === 0) color = "bg-red-500"
    else if (quantity <= minStock) color = "bg-yellow-500"

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
    )
  }

  const getTotalValue = () => {
    return filteredInventory.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  }

  const getLowStockCount = () => {
    return inventory.filter((item) => item.quantity <= item.minStock && item.quantity > 0).length
  }

  const getOutOfStockCount = () => {
    return inventory.filter((item) => item.quantity === 0).length
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">Track and manage all inventory items across warehouses</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/inventory/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">Unique SKUs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">ETB {getTotalValue().toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current inventory value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{getLowStockCount()}</div>
              <p className="text-xs text-muted-foreground">Items below minimum</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{getOutOfStockCount()}</div>
              <p className="text-xs text-muted-foreground">Items unavailable</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search items, SKU, supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              Showing {filteredInventory.length} of {inventory.length} items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Details</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.supplier}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.warehouse}</TableCell>
                    <TableCell className="w-24">
                      {getStockLevel(item.quantity, item.minStock, item.maxStock)}
                      <div className="text-xs text-muted-foreground mt-1">
                        Min: {item.minStock} | Max: {item.maxStock}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={item.quantity <= item.minStock ? "text-yellow-600 font-medium" : ""}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell>ETB {item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(item.status, item.quantity, item.minStock)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
