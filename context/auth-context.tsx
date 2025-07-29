"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "admin" | "warehouse_manager" | "inventory_clerk" | "technician" | "auditor"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  warehouse?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  "admin@ethiotelecom.et": {
    password: "admin123",
    user: {
      id: "1",
      name: "System Administrator",
      email: "admin@ethiotelecom.et",
      role: "admin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
  "manager@ethiotelecom.et": {
    password: "manager123",
    user: {
      id: "2",
      name: "Warehouse Manager",
      email: "manager@ethiotelecom.et",
      role: "warehouse_manager",
      warehouse: "Addis Ababa Central",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
  "clerk@ethiotelecom.et": {
    password: "clerk123",
    user: {
      id: "3",
      name: "Inventory Clerk",
      email: "clerk@ethiotelecom.et",
      role: "inventory_clerk",
      warehouse: "Addis Ababa Central",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
  "tech@ethiotelecom.et": {
    password: "tech123",
    user: {
      id: "4",
      name: "Technician",
      email: "admin@ethiotelecom.et",
      role: "admin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("twms_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser = mockUsers[email]
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user)
      localStorage.setItem("twms_user", JSON.stringify(mockUser.user))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("twms_user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
