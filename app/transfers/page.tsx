"use client"

import type React from "react"

import { useState } from "react"
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

// Mock transfer data
const transfersData = [
  {
    id: "TRF001",
    item: "Router TP-Link AC1200",
    sku: "TPL-AC1200",
    quantity: 10,
    fromWarehouse: "Addis Ababa Central",
    toWarehouse: "Dire Dawa Regional",
    requestedBy: "Fatuma Ahmed",
    approvedBy: "Alemayehu Tadesse",
    status: "Completed",
    requestDate: "2024-01-15",
    completedDate: "2024-01-16",
    notes: "Urgent transfer for network expansion",
  },
  {
    id: "TRF002",
    item: "Ethernet Cable Cat6 (100m)",
    sku: "ETH-CAT6-100",
    quantity: 25,
    fromWarehouse: "Bahir Dar Branch",
    toWarehouse: "Mekelle Central",
    requestedBy: "Hailay Gebru",
    approvedBy: null,
    status: "Pending",
    requestDate: "2024-01-16",
    completedDate: null,
    notes: "Monthly stock redistribution",
  },
  {
    id: "TRF003",
    item: "SIM Card - Prepaid",
    sku: "SIM-PREP-001",
    quantity: 100,
    fromWarehouse: "Addis Ababa Central",
    toWarehouse: "Hawassa Branch",
    requestedBy: "Tekle Mamo",
    approvedBy: "Alemayehu Tadesse",
    status: "In Transit",
    requestDate: "2024-01-14",
    completedDate: null,
    notes: "Customer demand increase",
  },
  {
    id: "TRF004",
    item: "Wireless Access Point",
    sku: "WAP-001",
    quantity: 5,
    fromWarehouse: "Dire Dawa Regional",
    toWarehouse: "Jimma Regional",
    requestedBy: "Meseret Bekele",
    approvedBy: null,
    status: "Rejected",
    requestDate: "2024-01-13",
    completedDate: null,
    notes: "Insufficient stock at source warehouse",
  },
]

const warehouses = [
  "Addis Ababa Central",
  "Dire Dawa Regional",
  "Bahir Dar Branch",
  "Mekelle Central",
  "Hawassa Branch",
  "Jimma Regional",
]

const mockInventory = [
  { sku: "TPL-AC1200", name: "Router TP-Link AC1200", available: 45 },
  { sku: "ETH-CAT6-100", name: "Ethernet Cable Cat6 (100m)", available: 15 },
  { sku: "SIM-PREP-001", name: "SIM Card - Prepaid", available: 500 },
  { sku: "WAP-001", name: "Wireless Access Point", available: 32 },
]

export default function TransfersPage() {
  const [transfers, setTransfers] = useState(transfersData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false)
  const [newTransfer, setNewTransfer] = useState({
    item: "",
    quantity: "",
    fromWarehouse: "",
    toWarehouse: "",
    notes: "",
  })

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All Status" || transfer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
    > = {
      Completed: { variant: "default", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      "In Transit": { variant: "secondary", icon: <Clock className="w-3 h-3 mr-1" /> },
      Pending: { variant: "outline", icon: <Clock className="w-3 h-3 mr-1" /> },
      Rejected: { variant: "destructive", icon: <XCircle className="w-3 h-3 mr-1" /> },
    }

    const config = variants[status] || { variant: "outline", icon: null }

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const handleCreateTransfer = () => {
    const transfer = {
      id: `TRF${(transfers.length + 1).toString().padStart(3, "0")}`,
      item: mockInventory.find((item) => item.sku === newTransfer.item)?.name || "",
      sku: newTransfer.item,
      quantity: Number.parseInt(newTransfer.quantity),
      fromWarehouse: newTransfer.fromWarehouse,
      toWarehouse: newTransfer.toWarehouse,
      requestedBy: "Current User",
      approvedBy: null,
      status: "Pending",
      requestDate: new Date().toISOString().split("T")[0],
      completedDate: null,
      notes: newTransfer.notes,
    }

    setTransfers([transfer, ...transfers])
    setNewTransfer({
      item: "",
      quantity: "",
      fromWarehouse: "",
      toWarehouse: "",
      notes: "",
    })
    setIsNewTransferOpen(false)
  }

  const getStatusCounts = () => {
    return {
      total: transfers.length,
      pending: transfers.filter((t) => t.status === "Pending").length,
      inTransit: transfers.filter((t) => t.status === "In Transit").length,
      completed: transfers.filter((t) => t.status === "Completed").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
            <p className="text-muted-foreground">Manage stock movements between warehouses</p>
          </div>
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
                    value={newTransfer.item}
                    onValueChange={(value) => setNewTransfer({ ...newTransfer, item: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockInventory.map((item) => (
                        <SelectItem key={item.sku} value={item.sku}>
                          {item.name} (Available: {item.available})
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
                      value={newTransfer.fromWarehouse}
                      onValueChange={(value) => setNewTransfer({ ...newTransfer, fromWarehouse: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse} value={warehouse}>
                            {warehouse}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toWarehouse">To Warehouse</Label>
                    <Select
                      value={newTransfer.toWarehouse}
                      onValueChange={(value) => setNewTransfer({ ...newTransfer, toWarehouse: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          .filter((w) => w !== newTransfer.fromWarehouse)
                          .map((warehouse) => (
                            <SelectItem key={warehouse} value={warehouse}>
                              {warehouse}
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
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
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
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono text-sm">{transfer.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.item}</div>
                        <div className="text-sm text-muted-foreground">{transfer.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{transfer.fromWarehouse}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{transfer.toWarehouse}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transfer.requestedBy}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>{transfer.requestDate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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
