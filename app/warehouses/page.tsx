"use client"
import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { WarehousesContent } from "@/components/pages/warehouses-content"

export default function WarehousesPage() {
  return (
    <ProtectedRoute resource="warehouses" action="read">
      <MainLayout>
        <WarehousesContent />
      </MainLayout>
    </ProtectedRoute>
  )
}
