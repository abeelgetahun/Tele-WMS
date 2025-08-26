"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { useAuth } from "@/context/auth-context"
import { hasPermission } from "@/lib/permissions"

const roles = [
  { value: "ADMIN", label: "Administrator" },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "INVENTORY_CLERK", label: "Inventory Clerk" },
  { value: "TECHNICIAN", label: "Technician" },
  { value: "AUDITOR", label: "Auditor" },
]

export default function UsersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    warehouseId: "",
    status: "Active",
  })
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [usrs, whs] = (await Promise.all([apiClient.getUsers(), apiClient.getWarehouses()])) as [any[], any[]]
        setUsers(usrs)
        setWarehouses(whs.map((w: any) => ({ id: w.id, name: w.name })))
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load users", variant: "destructive" })
      }
    }
    load()
  }, [toast])

  const filteredUsers = useMemo(() => users.filter((user: any) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || (user.isActive ? "Active" : "Inactive") === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  }), [users, searchTerm, roleFilter, statusFilter])

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Administrator",
      WAREHOUSE_MANAGER: "Warehouse Manager",
      INVENTORY_CLERK: "Inventory Clerk",
      TECHNICIAN: "Technician",
      AUDITOR: "Auditor",
    }
    return roleMap[role] || role
  }

  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ADMIN: "destructive",
      WAREHOUSE_MANAGER: "default",
      INVENTORY_CLERK: "secondary",
      TECHNICIAN: "outline",
      AUDITOR: "secondary",
    }
    return variantMap[role] || "default"
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
    > = {
      Active: { variant: "default", icon: <UserCheck className="w-3 h-3 mr-1" /> },
      Inactive: { variant: "destructive", icon: <UserX className="w-3 h-3 mr-1" /> },
    }

    const config = variants[status] || { variant: "outline", icon: null }

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const handleCreateUser = async () => {
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password || "password123",
        role: newUser.role,
        warehouseId: newUser.warehouseId || undefined,
        isActive: newUser.status === "Active",
      }
      const created = await apiClient.createUser(payload)
      setUsers((prev) => [created, ...prev])
      toast({ title: "User created" })
      setNewUser({ name: "", email: "", password: "", role: "", warehouseId: "", status: "Active" })
      setIsNewUserOpen(false)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create user", variant: "destructive" })
    }
  }

  const getStatusCounts = () => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      inactive: users.filter((u) => u.status === "Inactive").length,
  admins: users.filter((u: any) => u.role === "ADMIN").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <ProtectedRoute resource="users" action="read">
      <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users and their access permissions</p>
          </div>
          {user && hasPermission(user.role, "users", "create") && (
            <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account in the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@ethiotelecom.et"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select
                      value={newUser.warehouseId}
                      onValueChange={(value) => setNewUser({ ...newUser, warehouseId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newUser.status} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>Add User</Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statusCounts.inactive}</div>
              <p className="text-xs text-muted-foreground">Deactivated accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statusCounts.admins}</div>
              <p className="text-xs text-muted-foreground">Admin accounts</p>
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
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
          <SelectItem value="ALL">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {users.length} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleDisplay(user.role)}</Badge>
                    </TableCell>
                    <TableCell>{user.warehouse?.name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(user.isActive ? "Active" : "Inactive")}</TableCell>
                    <TableCell>{user.lastLogin ? new Date(user.lastLogin).toISOString().split("T")[0] : "-"}</TableCell>
                    <TableCell>{new Date(user.createdAt).toISOString().split("T")[0]}</TableCell>
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
    </ProtectedRoute>
  )
}
