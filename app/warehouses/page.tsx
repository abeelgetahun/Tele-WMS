"use client"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MapPin, Users, Package, Edit, Trash2 } from "lucide-react"

// Mock warehouse data
const warehousesData = [
  {
    id: "1",
    name: "Addis Ababa Central",
    location: "Addis Ababa, Ethiopia",
    manager: "Alemayehu Tadesse",
    capacity: 5000,
    currentStock: 4250,
    status: "Active",
    phone: "+251-11-123-4567",
    address: "Bole Sub City, Addis Ababa",
  },
  {
    id: "2",
    name: "Dire Dawa Regional",
    location: "Dire Dawa, Ethiopia",
    manager: "Fatuma Ahmed",
    capacity: 3000,
    currentStock: 1850,
    status: "Active",
    phone: "+251-25-111-2233",
    address: "Kezira, Dire Dawa",
  },
  {
    id: "3",
    name: "Bahir Dar Branch",
    location: "Bahir Dar, Ethiopia",
    manager: "Getachew Alemu",
    capacity: 2500,
    currentStock: 1950,
    status: "Active",
    phone: "+251-58-220-1122",
    address: "Kebele 01, Bahir Dar",
  },
  {
    id: "4",
    name: "Mekelle Central",
    location: "Mekelle, Ethiopia",
    manager: "Hailay Gebru",
    capacity: 2000,
    currentStock: 1420,
    status: "Maintenance",
    phone: "+251-34-440-5566",
    address: "Ayder, Mekelle",
  },
]

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState(warehousesData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    location: "",
    manager: "",
    capacity: "",
    phone: "",
    address: "",
    status: "Active",
  })

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.manager.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Active: "default",
      Maintenance: "secondary",
      Inactive: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getUtilizationColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100
    if (percentage >= 90) return "text-destructive"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const handleAddWarehouse = () => {
    const warehouse = {
      id: (warehouses.length + 1).toString(),
      name: newWarehouse.name,
      location: newWarehouse.location,
      manager: newWarehouse.manager,
      capacity: Number.parseInt(newWarehouse.capacity),
      currentStock: 0,
      status: newWarehouse.status,
      phone: newWarehouse.phone,
      address: newWarehouse.address,
    }

    setWarehouses([...warehouses, warehouse])
    setNewWarehouse({
      name: "",
      location: "",
      manager: "",
      capacity: "",
      phone: "",
      address: "",
      status: "Active",
    })
    setIsAddDialogOpen(false)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
            <p className="text-muted-foreground">Manage and monitor all warehouse locations</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Warehouse</DialogTitle>
                <DialogDescription>Create a new warehouse location in the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Warehouse Name</Label>
                    <Input
                      id="name"
                      value={newWarehouse.name}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                      placeholder="Enter warehouse name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newWarehouse.location}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                      placeholder="City, Region"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Input
                      id="manager"
                      value={newWarehouse.manager}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, manager: e.target.value })}
                      placeholder="Manager name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newWarehouse.capacity}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: e.target.value })}
                      placeholder="Maximum items"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newWarehouse.phone}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, phone: e.target.value })}
                      placeholder="+251-XX-XXX-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newWarehouse.status}
                      onValueChange={(value) => setNewWarehouse({ ...newWarehouse, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newWarehouse.address}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWarehouse}>Add Warehouse</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Warehouses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                  {getStatusBadge(warehouse.status)}
                </div>
                <CardDescription className="flex items-center">
                  <MapPin className="mr-1 h-3 w-3" />
                  {warehouse.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    Manager
                  </span>
                  <span className="font-medium">{warehouse.manager}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Package className="mr-1 h-3 w-3" />
                    Utilization
                  </span>
                  <span className={`font-medium ${getUtilizationColor(warehouse.currentStock, warehouse.capacity)}`}>
                    {warehouse.currentStock}/{warehouse.capacity} (
                    {Math.round((warehouse.currentStock / warehouse.capacity) * 100)}%)
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>{warehouse.phone}</p>
                  <p>{warehouse.address}</p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Warehouses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Warehouses</CardTitle>
            <CardDescription>Complete list of warehouse locations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                    <TableCell>{warehouse.location}</TableCell>
                    <TableCell>{warehouse.manager}</TableCell>
                    <TableCell>
                      <span className={getUtilizationColor(warehouse.currentStock, warehouse.capacity)}>
                        {warehouse.currentStock}/{warehouse.capacity}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(warehouse.status)}</TableCell>
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
