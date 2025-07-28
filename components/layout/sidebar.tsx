"use client"

import type React from "react"

import Image from "next/image"
import ethioLogo from "@/assets/ethio-telecom-logo.png"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/auth-context"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "warehouse_manager", "inventory_clerk", "technician", "auditor"],
  },
  {
    title: "Warehouses",
    href: "/warehouses",
    icon: Warehouse,
    roles: ["admin", "warehouse_manager"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["admin", "warehouse_manager", "inventory_clerk"],
  },
  {
    title: "Stock Transfers",
    href: "/transfers",
    icon: ArrowLeftRight,
    roles: ["admin", "warehouse_manager", "inventory_clerk"],
  },
  {
    title: "Stock Audit",
    href: "/audit",
    icon: ClipboardCheck,
    roles: ["admin", "warehouse_manager", "auditor"],
  },
  {
    title: "User Management",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "warehouse_manager", "auditor"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "warehouse_manager"],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <div
      className={cn(
        "relative flex flex-col bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
 {/* Header */}
<div className="relative flex flex-col items-center justify-center pt-6 pb-4 border-b space-y-2">
  <Image
    src={ethioLogo}
    alt="Ethio Telecom Logo"
    className="h-16 w-auto object-contain mt-2"
    priority
  />
  {!collapsed && (
    <div className="text-center">
      <h1 className="text-sm font-semibold">TWMS</h1>
      <p className="text-xs text-muted-foreground">Ethio Telecom</p>
    </div>
  )}
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setCollapsed(!collapsed)}
    className="absolute top-2 right-2 h-8 w-8 z-10"
  >
    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
  </Button>
</div>




      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", collapsed && "px-2")}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
