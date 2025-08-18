"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function AddInventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    unitPrice: "",
    supplier: "",
    categoryId: "",
    warehouseId: "",
  })

  const findCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name as string | undefined
  const findWarehouseName = (id?: string) => warehouses.find((w) => w.id === id)?.name as string | undefined

  const generateSku = (categoryName?: string, warehouseName?: string) => {
    const norm = (s?: string, len = 3) =>
      (s || "").replace(/[^A-Za-z0-9]/g, "").slice(0, len).toUpperCase().padEnd(len, "X")
    const cat = norm(categoryName || "GEN", 3)
    const wh = warehouseName ? norm(warehouseName, 3) : ""
    const ts = Date.now().toString().slice(-4)
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 6)
    return [cat, wh, ts, rand].filter(Boolean).join("-")
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [categoriesData, warehousesData] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getWarehouses(),
        ])
        setCategories(categoriesData)
        setWarehouses(warehousesData)
        // Default to user's warehouse if available
        if (user?.warehouseId) setForm((f) => ({ ...f, warehouseId: user.warehouseId! }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.warehouseId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Auto-generate SKU if empty
      const categoryName = findCategoryName(form.categoryId)
      const warehouseName = findWarehouseName(form.warehouseId || user?.warehouseId)
      let skuToUse = (form.sku || "").trim() || generateSku(categoryName, warehouseName)
      await apiClient.createInventoryItem({
        name: form.name.trim(),
        description: form.description || undefined,
        sku: skuToUse,
        barcode: form.barcode || undefined,
        unitPrice: Number(form.unitPrice || 0),
        supplier: form.supplier || undefined,
        categoryId: form.categoryId,
        warehouseId: form.warehouseId || user?.warehouseId,
      })
      toast({ title: "Item created", description: "Single-unit SKU registered successfully." })
      setForm({ name: "", description: "", sku: "", barcode: "", unitPrice: "", supplier: "", categoryId: "", warehouseId: user?.warehouseId || "" })
    } catch (e: any) {
      // If SKU conflict, regenerate once and retry
      if (typeof e?.message === "string" && e.message.toLowerCase().includes("sku already exists")) {
        try {
          const categoryName = findCategoryName(form.categoryId)
          const warehouseName = findWarehouseName(form.warehouseId || user?.warehouseId)
          const retrySku = generateSku(categoryName, warehouseName)
          await apiClient.createInventoryItem({
            name: form.name.trim(),
            description: form.description || undefined,
            sku: retrySku,
            barcode: form.barcode || undefined,
            unitPrice: Number(form.unitPrice || 0),
            supplier: form.supplier || undefined,
            categoryId: form.categoryId,
            warehouseId: form.warehouseId || user?.warehouseId,
          })
          toast({ title: "Item created", description: `SKU auto-generated: ${retrySku}` })
          setForm({ name: "", description: "", sku: "", barcode: "", unitPrice: "", supplier: "", categoryId: "", warehouseId: user?.warehouseId || "" })
        } catch (err: any) {
          toast({ title: "Create failed", description: err?.message || "", variant: "destructive" })
        }
      } else {
        toast({ title: "Create failed", description: e?.message || "", variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute resource="inventory" action="create">
        <MainLayout>
          <div className="p-6">Loading...</div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute resource="inventory" action="create">
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Register Item</h1>
              <p className="text-muted-foreground">Each SKU represents a single unit</p>
            </div>
            <Link href="/inventory" className="text-sm underline">Back to Inventory</Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Enter item information. SKU must be unique.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (unique)</Label>
                  <div className="flex gap-2">
                    <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto or custom" />
                    <Button type="button" variant="outline" onClick={() => {
                      const categoryName = findCategoryName(form.categoryId)
                      const warehouseName = findWarehouseName(form.warehouseId || user?.warehouseId)
                      const newSku = generateSku(categoryName, warehouseName)
                      setForm({ ...form, sku: newSku })
                      toast({ title: "SKU generated", description: newSku })
                    }}>
                      <Sparkles className="w-4 h-4 mr-1" /> Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input id="unitPrice" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input id="supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.categoryId} onValueChange={(v) => {
                    // If no SKU yet, generate a starter SKU when category is chosen
                    const next = { ...form, categoryId: v }
                    if (!next.sku) {
                      const categoryName = findCategoryName(v)
                      const warehouseName = findWarehouseName(next.warehouseId || user?.warehouseId)
                      next.sku = generateSku(categoryName, warehouseName)
                    }
                    setForm(next)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Select value={form.warehouseId} onValueChange={(v) => {
                    const next = { ...form, warehouseId: v }
                    setForm(next)
                  }}>
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Item"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
