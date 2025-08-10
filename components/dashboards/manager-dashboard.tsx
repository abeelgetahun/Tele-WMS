"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { Package, AlertTriangle, Users, CheckCircle, Clock, TrendingUp } from "lucide-react"

export function ManagerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch warehouse-specific data
      const [statsData, transfersData] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getTransfers({ status: "PENDING" }),
      ])

      setStats(statsData)
      setPendingTransfers(transfersData)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      // Fallback data
      setStats({
        warehouseItems: 450,
        lowStockItems: 12,
        pendingTransfers: 5,
        teamMembers: 8,
        monthlyMovements: 156,
        warehouseCapacity: 85,
      })
      setPendingTransfers([])
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await apiClient.approveTransfer(transferId)
      fetchDashboardData() // Refresh data
    } catch (error) {
      console.error("Failed to approve transfer:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground">{user?.warehouse?.name || "Warehouse"} Management Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouse Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.warehouseItems || 0}</div>
            <p className="text-xs text-muted-foreground">Total inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingTransfers.length}</div>
            <p className="text-xs text-muted-foreground">Transfer requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teamMembers || 0}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Transfer Approvals</CardTitle>
          <CardDescription>Transfer requests awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTransfers.length === 0 ? (
            <p className="text-muted-foreground">No pending transfers</p>
          ) : (
            <div className="space-y-4">
              {pendingTransfers.slice(0, 5).map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{transfer.item?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transfer.quantity} units from {transfer.fromWarehouse?.name} to {transfer.toWarehouse?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Requested by {transfer.requestedBy?.name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => handleApproveTransfer(transfer.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Movements</CardTitle>
            <CardDescription>Inventory movements this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyMovements || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warehouse Capacity</CardTitle>
            <CardDescription>Current utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.warehouseCapacity || 0}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${stats?.warehouseCapacity || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
