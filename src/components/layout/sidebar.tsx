'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Scissors,
  ShoppingCart,
  Heart,
  Sparkles,
  Settings,
  ClipboardList,
  Package,
  LogOut,
  Camera,
  Gift,
  Bell,
  BarChart3,
  Stethoscope,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Pets', href: '/pets', icon: PawPrint },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Grooming', href: '/grooming', icon: Scissors },
  { name: 'Workload', href: '/grooming/workload', icon: BarChart3 },
  { name: 'Gallery', href: '/gallery', icon: Camera },
  { name: 'Services', href: '/services', icon: ClipboardList },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Veterinary', href: '/veterinary', icon: Stethoscope },
  { name: 'Health & Safety', href: '/health', icon: Heart },
  { name: 'Loyalty', href: '/loyalty', icon: Gift },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'AI Features', href: '/ai', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  return (
    <div className="flex h-screen w-64 flex-col bg-secondary-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-secondary-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <PawPrint className="h-8 w-8 text-primary-400" />
          <span className="text-xl font-bold">PetGroom Pro</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => {
            // Exact match OR starts with href followed by / (for child routes not in menu)
            // But exclude if another menu item is a better match (more specific path)
            const isExactMatch = pathname === item.href
            const isChildRoute = pathname.startsWith(item.href + '/')
            // Check if there's a more specific menu item that matches
            const hasMoreSpecificMatch = navigation.some(
              (other) => other.href !== item.href &&
                         other.href.startsWith(item.href + '/') &&
                         pathname.startsWith(other.href)
            )
            const isActive = isExactMatch || (isChildRoute && !hasMoreSpecificMatch)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-secondary-700 p-4">
        <button
          onClick={() => setLogoutDialogOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-300 transition-colors hover:bg-secondary-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access the app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/auth/login' })}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
