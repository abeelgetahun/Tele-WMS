"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { hasPermission } from "@/lib/permissions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  resource: string
  action: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, resource, action, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (!hasPermission(user.role, resource, action)) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this resource.</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
