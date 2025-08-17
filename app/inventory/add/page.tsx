"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"

const suppliers = [
  "Tech Solutions Ltd",
  "Cable Corp",
  "Ethio Telecom",
  "Fiber Tech",
  "Network Pro",
  "Equipment Plus",
]

export default function AddInventoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    sku: "",
    barcode: "",
    warehouseId: "",
    quantity: "",
    minStock: "",
    maxStock: "",
    unitPrice: "",
    supplier: "",
    supplierContact: "",
    notes: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        
        // Load categories
        const cats = await apiClient.getCategories()
        setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })))
        
        // Load warehouses based on user role
        if (user?.role === "ADMIN") {
          // Admin can see all warehouses
          const whs = await apiClient.getWarehouses()
          setWarehouses(whs.map((w: any) => ({ id: w.id, name: w.name })))
        } else if (user?.warehouseId) {
          // Non-admin users can only see their assigned warehouse
          const whs = await apiClient.getWarehouses()
          const userWarehouse = whs.find((w: any) => w.id === user.warehouseId)
          if (userWarehouse) {
            setWarehouses([{ id: userWarehouse.id, name: userWarehouse.name }])
            // Auto-assign warehouse for non-admin users
            setFormData(prev => ({ ...prev, warehouseId: user.warehouseId! }))
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "Error",
          description: "Failed to load categories and warehouses. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      load()
    }
  }, [user, toast])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const generateSKU = () => {
    const categoryName = categories.find((c) => c.id === formData.categoryId)?.name || "GEN"
    const prefix = categoryName.substring(0, 3).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sku = `${prefix}-${random}`
    setFormData((prev) => ({ ...prev, sku }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Ensure warehouse is set for non-admin users
    if (user?.role !== "ADMIN" && user?.warehouseId && !formData.warehouseId) {
      setFormData(prev => ({ ...prev, warehouseId: user.warehouseId! }))
    }

    // Validate required fields based on user role
    const requiredFields = ["name", "categoryId", "sku", "quantity", "unitPrice", "supplier"]
    
    // Only require warehouseId for admin users (non-admin users have it auto-assigned)
    if (user?.role === "ADMIN") {
      requiredFields.push("warehouseId")
    }
    
    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    try {
      // Ensure warehouseId is set for non-admin users
      const warehouseId = user?.role === "ADMIN" ? formData.warehouseId : user?.warehouseId

      await apiClient.createInventoryItem({
        name: formData.name,
        description: formData.description || undefined,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        quantity: Number(formData.quantity),
        minStock: formData.minStock ? Number(formData.minStock) : 0,
        maxStock: formData.maxStock ? Number(formData.maxStock) : 100,
        unitPrice: Number(formData.unitPrice),
        supplier: formData.supplier || undefined,
        categoryId: formData.categoryId,
        warehouseId: warehouseId!,
      })
      toast({ title: "Item Added Successfully", description: `${formData.name} has been added to inventory.` })
      router.push("/inventory")
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create item", variant: "destructive" })
    }
  }

  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we load the form data.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Inventory Item</h1>
            <p className="text-muted-foreground">
              Add a new item to the warehouse inventory system
              {user?.warehouse && ` - ${user.warehouse.name}`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Basic Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the basic details of the inventory item</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => handleInputChange("categoryId", value)}
                        disabled={loading || categories.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {categories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No categories available. Please contact an administrator.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter item description"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                          placeholder="Enter SKU"
                          required
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generateSKU}
                          disabled={!formData.categoryId}
                        >
                          Generate
                        </Button>
                      </div>
                      {!formData.categoryId && (
                        <p className="text-sm text-muted-foreground">Select a category first to generate SKU</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => handleInputChange("barcode", e.target.value)}
                        placeholder="Enter barcode"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Information */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Stock Information</CardTitle>
                  <CardDescription>Set stock levels and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Warehouse selection - only show for admins */}
                  {user?.role === "ADMIN" && (
                    <div className="space-y-2">
                      <Label htmlFor="warehouse">Warehouse *</Label>
                      <Select
                        value={formData.warehouseId}
                        onValueChange={(value) => handleInputChange("warehouseId", value)}
                        disabled={loading || warehouses.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={warehouses.length === 0 ? "No warehouses available" : "Select warehouse"} />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Initial Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Min Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => handleInputChange("minStock", e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Max Stock</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={formData.maxStock}
                        onChange={(e) => handleInputChange("maxStock", e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (ETB) *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => handleInputChange("unitPrice", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>Enter supplier details for this item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select value={formData.supplier} onValueChange={(value) => handleInputChange("supplier", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierContact">Supplier Contact</Label>
                  <Input
                    id="supplierContact"
                    value={formData.supplierContact}
                    onChange={(e) => handleInputChange("supplierContact", e.target.value)}
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about this item"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
