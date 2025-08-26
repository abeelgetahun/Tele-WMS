"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, ArrowRight, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { hasPermission } from "@/lib/permissions"
import { useAuth } from "@/context/auth-context"

export default function TransfersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transfers, setTransfers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false)
  const [newTransfer, setNewTransfer] = useState({
    itemId: "",
    quantity: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    notes: "",
  })
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [trs, whs, inv] = (await Promise.all([
          apiClient.getTransfers({ status: statusFilter === "ALL" ? "all" : statusFilter }),
          apiClient.getWarehouses(),
          apiClient.getInventory(),
        ])) as [any[], any[], any[]]
        setTransfers(trs)
        setWarehouses(whs.map((w: any) => ({ id: w.id, name: w.name })))
        setItems(inv)
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load transfers", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [statusFilter, toast])

  const filteredTransfers = useMemo(() => transfers.filter((transfer: any) => {
    const matchesSearch =
      transfer.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.item?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "ALL" || transfer.status === statusFilter

    return matchesSearch && matchesStatus
  }), [transfers, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
    > = {
      COMPLETED: { variant: "default", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      IN_TRANSIT: { variant: "secondary", icon: <Clock className="w-3 h-3 mr-1" /> },
      PENDING: { variant: "outline", icon: <Clock className="w-3 h-3 mr-1" /> },
      REJECTED: { variant: "destructive", icon: <XCircle className="w-3 h-3 mr-1" /> },
      APPROVED: { variant: "default", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    }

    const config = variants[status] || { variant: "outline", icon: null }

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const handleCreateTransfer = async () => {
    try {
      await apiClient.createTransfer({
        itemId: newTransfer.itemId,
        quantity: Number(newTransfer.quantity),
        fromWarehouseId: newTransfer.fromWarehouseId,
        toWarehouseId: newTransfer.toWarehouseId,
        notes: newTransfer.notes || undefined,
      })
      toast({ title: "Transfer created" })
      setIsNewTransferOpen(false)
      setNewTransfer({ itemId: "", quantity: "", fromWarehouseId: "", toWarehouseId: "", notes: "" })
      const refreshed = (await apiClient.getTransfers({ status: statusFilter === "ALL" ? "all" : statusFilter })) as any[]
      setTransfers(refreshed)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create transfer", variant: "destructive" })
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await apiClient.approveTransfer(id)
      toast({ title: "Transfer approved" })
      setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status: "APPROVED" } : t)))
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to approve", variant: "destructive" })
    }
  }

  const getStatusCounts = () => {
    return {
      total: transfers.length,
      pending: transfers.filter((t) => t.status === "PENDING").length,
      inTransit: transfers.filter((t) => t.status === "IN_TRANSIT").length,
      completed: transfers.filter((t) => t.status === "COMPLETED").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <ProtectedRoute resource="transfers" action="read">
      <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
            <p className="text-muted-foreground">Manage stock movements between warehouses</p>
          </div>
          {user && hasPermission(user.role, "transfers", "create") && (
            <Dialog open={isNewTransferOpen} onOpenChange={setIsNewTransferOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Transfer
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Stock Transfer</DialogTitle>
                <DialogDescription>Transfer inventory items between warehouses.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item">Item</Label>
                  <Select
                    value={newTransfer.itemId}
                    onValueChange={(value) => {
                      const itm = items.find((i) => i.id === value)
                      setNewTransfer({
                        ...newTransfer,
                        itemId: value,
                        fromWarehouseId: itm?.warehouse?.id || newTransfer.fromWarehouseId,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} — {item.sku} ({item.warehouse?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newTransfer.quantity}
                    onChange={(e) => setNewTransfer({ ...newTransfer, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromWarehouse">From Warehouse</Label>
                    <Select
                      value={newTransfer.fromWarehouseId}
                      onValueChange={(value) => setNewTransfer({ ...newTransfer, fromWarehouseId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
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

                  <div className="space-y-2">
                    <Label htmlFor="toWarehouse">To Warehouse</Label>
                    <Select
                      value={newTransfer.toWarehouseId}
                      onValueChange={(value) => setNewTransfer({ ...newTransfer, toWarehouseId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          .filter((w) => w.id !== newTransfer.fromWarehouseId)
                          .map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newTransfer.notes}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    placeholder="Transfer reason or additional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewTransferOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTransfer}>Create Transfer</Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statusCounts.inTransit}</div>
              <p className="text-xs text-muted-foreground">Being transferred</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
              <p className="text-xs text-muted-foreground">Successfully transferred</p>
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
                    placeholder="Search transfers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>
              Showing {filteredTransfers.length} of {transfers.length} transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono text-sm">{transfer.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.item?.name}</div>
                        <div className="text-sm text-muted-foreground">{transfer.item?.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{transfer.fromWarehouse?.name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{transfer.toWarehouse?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transfer.requestedBy?.name}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>{new Date(transfer.requestDate).toISOString().split("T")[0]}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user && hasPermission(user.role, "transfers", "approve") && transfer.status === "PENDING" && (
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(transfer.id)}>
                            Approve
                          </Button>
                        )}
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
    </ProtectedRoute>
  )
}
