"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { useAuth } from "@/context/auth-context"
import { getRoleDisplayName } from "@/lib/permissions"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { ManagerDashboard } from "@/components/dashboards/manager-dashboard"
import { ClerkDashboard } from "@/components/dashboards/clerk-dashboard"
import { TechnicianDashboard } from "@/components/dashboards/technician-dashboard"
import { AuditorDashboard } from "@/components/dashboards/auditor-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboardType, setDashboardType] = useState<string>("clerk")

  useEffect(() => {
    if (user?.role) {
      const roleMap: Record<string, string> = {
        ADMIN: "admin",
        WAREHOUSE_MANAGER: "manager",
        INVENTORY_CLERK: "clerk",
        TECHNICIAN: "technician",
        AUDITOR: "auditor",
      }
      setDashboardType(roleMap[user.role] ?? "clerk")
    }
  }, [user?.role])

  const renderDashboard = () => {
    switch (dashboardType) {
      case "admin":
        return <AdminDashboard />
      case "manager":
        return <ManagerDashboard />
      case "clerk":
        return <ClerkDashboard />
      case "technician":
        return <TechnicianDashboard />
      case "auditor":
        return <AuditorDashboard />
      default:
        return <ClerkDashboard />
    }
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          {getRoleDisplayName(user.role)} Dashboard
          {user.warehouse && ` - ${user.warehouse.name}`}
        </p>
      </div>
      {renderDashboard()}
    </MainLayout>
  )
}
