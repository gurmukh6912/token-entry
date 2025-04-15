"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  Settings,
  Users,
  BarChart
} from "lucide-react"

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "My Tickets",
    href: "/dashboard/tickets",
    icon: Ticket
  },
  {
    name: "Events",
    href: "/dashboard/events",
    icon: CalendarDays
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart
  },
  {
    name: "Team",
    href: "/dashboard/team",
    icon: Users
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings
  }
]

export default function DashboardLayout({
  children
}: {
  children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <aside className="hidden lg:flex h-screen w-64 flex-col fixed inset-y-0">
        <div className="flex flex-col flex-grow border-r bg-card px-4 py-6">
          <div className="flex items-center h-16 mb-8">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold">TokenEntry</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-4 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
      <div className="flex flex-col flex-1 lg:pl-64">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 