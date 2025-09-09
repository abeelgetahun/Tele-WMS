"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { AlertTriangle, CheckCircle, Calendar, TrendingUp } from "lucide-react"

export function AuditorDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch auditor-specific data
      const data = await apiClient.getDashboardStats()
      setStats({
        scheduledAudits: 3,
        completedAudits: 8,
        discrepanciesFound: 12,
        complianceScore: 94,
        pendingReports: 2,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setStats({
        scheduledAudits: 3,
        completedAudits: 8,
        discrepanciesFound: 12,
        complianceScore: 94,
        pendingReports: 2,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <div className="flex items-center justify-end">
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Audits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduledAudits || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Audits</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completedAudits || 0}</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.discrepanciesFound || 0}</div>
            <p className="text-xs text-muted-foreground">Found this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.complianceScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Audits</CardTitle>
          <CardDescription>Scheduled audit activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Addis Ababa Central - Full Audit</p>
                <p className="text-sm text-muted-foreground">Scheduled for January 20, 2024</p>
                <p className="text-xs text-muted-foreground">Expected duration: 2 days</p>
              </div>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Dire Dawa Regional - Spot Check</p>
                <p className="text-sm text-muted-foreground">Scheduled for January 25, 2024</p>
                <p className="text-xs text-muted-foreground">Expected duration: 4 hours</p>
              </div>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Reports</CardTitle>
            <CardDescription>Audit reports awaiting completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Bahir Dar Branch Audit</p>
                  <p className="text-sm text-muted-foreground">Due: January 18, 2024</p>
                </div>
                <Badge variant="destructive">Overdue</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mekelle Central Review</p>
                  <p className="text-sm text-muted-foreground">Due: January 22, 2024</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Trends</CardTitle>
            <CardDescription>Monthly compliance performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">December 2023</span>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">96%</div>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">November 2023</span>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">92%</div>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">October 2023</span>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">89%</div>
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
