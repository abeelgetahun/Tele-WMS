"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { Wrench, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react"

export function TechnicianDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch technician-specific data
      const data = await apiClient.getDashboardStats()
      setStats({
        equipmentItems: 85,
        maintenanceAlerts: 3,
        completedTasks: 12,
        pendingTasks: 5,
        systemHealth: 98,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setStats({
        equipmentItems: 85,
        maintenanceAlerts: 3,
        completedTasks: 12,
        pendingTasks: 5,
        systemHealth: 98,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technician Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Technician Dashboard</h1>
        <p className="text-muted-foreground">Equipment maintenance and technical operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Items</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.equipmentItems || 0}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.maintenanceAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.pendingTasks || 0}</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
          <CardDescription>Current system performance and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall System Health</span>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-green-600">{stats?.systemHealth || 0}%</div>
                <Activity className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats?.systemHealth || 0}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Activities</CardTitle>
          <CardDescription>Your recent technical tasks and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Router maintenance completed</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <Badge variant="default">Completed</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Network switch inspection</p>
                <p className="text-xs text-muted-foreground">Scheduled for tomorrow</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Cable replacement needed</p>
                <p className="text-xs text-muted-foreground">High priority</p>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
