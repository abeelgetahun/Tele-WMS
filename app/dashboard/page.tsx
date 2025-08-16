"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { useAuth } from "@/context/auth-context"
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

  return <MainLayout>{renderDashboard()}</MainLayout>
}
