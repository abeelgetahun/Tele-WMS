"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import type { UserRole } from "@/lib/permissions"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  warehouseId?: string
  warehouse?: {
    id: string
    name: string
  }
}

export interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Manual fallback users
const MANUAL_USERS: Array<AuthUser & { password?: string }> = [
  {
    id: "admin-1",
  email: "admin@telecom.et",
    password: "admin123",
    name: "System Administrator",
    role: "ADMIN" as UserRole,
  },
  {
    id: "manager-1",
  email: "manager@telecom.et",
    password: "manager123",
    name: "Warehouse Manager",
    role: "WAREHOUSE_MANAGER" as UserRole,
    warehouseId: "warehouse-1",
    warehouse: { id: "warehouse-1", name: "Addis Ababa Central" },
  },
  {
    id: "clerk-1",
  email: "clerk@telecom.et",
    password: "clerk123",
    name: "Inventory Clerk",
    role: "INVENTORY_CLERK" as UserRole,
    warehouseId: "warehouse-2",
    warehouse: { id: "warehouse-2", name: "Dire Dawa Regional" },
  },
  {
    id: "technician-1",
  email: "technician@telecom.et",
    password: "tech123",
    name: "System Technician",
    role: "TECHNICIAN" as UserRole,
  },
  {
    id: "auditor-1",
  email: "auditor@telecom.et",
    password: "audit123",
    name: "System Auditor",
    role: "AUDITOR" as UserRole,
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)

      // Try database login first
      try {
        const response = await apiClient.post("/auth/login", { email, password })

        if (response.token && response.user) {
          localStorage.setItem("token", response.token)
          localStorage.setItem("user", JSON.stringify(response.user))
          setUser(response.user)
          return true
        }
      } catch (dbError) {
        console.log("Database login failed, trying manual fallback...")
      }

      // Fallback to manual users
      const manualUser = MANUAL_USERS.find((u) => u.email === email && u.password === password)
      if (manualUser) {
        const { password: _, ...userWithoutPassword } = manualUser
        localStorage.setItem("user", JSON.stringify(userWithoutPassword))
        localStorage.setItem("token", "manual-token-" + manualUser.id)
        setUser(userWithoutPassword)
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
