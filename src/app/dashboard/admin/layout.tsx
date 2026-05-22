"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  BarChart3, Users, Building2, Sliders, Megaphone, Inbox, 
  ArrowLeft, ShieldAlert, Loader2, Sparkles, LogOut 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

const sidebarItems: SidebarItem[] = [
  { name: "Analytics Dashboard", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { name: "User Management", href: "/dashboard/admin/users", icon: Users },
  { name: "Company Tracker", href: "/dashboard/admin/companies", icon: Building2 },
  { name: "Cron & Manual Scans", href: "/dashboard/admin/cron", icon: Sliders },
  { name: "Notice Board", href: "/dashboard/admin/notices", icon: Megaphone },
  { name: "Support Inbox", href: "/dashboard/admin/inbox", icon: Inbox },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "admin") {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || (!authorized && !isLoading && isAuthenticated === null)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Authenticating Admin Session...</p>
      </div>
    );
  }

  if (!authorized && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground max-w-md mt-2 mb-6">
          This portal is reserved exclusively for system administrators. Your credentials do not authorize access to this section.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Premium Sidebar */}
      <aside className="w-72 bg-muted/20 border-r border-border/80 flex flex-col h-screen shrink-0 backdrop-blur-md">
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-border/60 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">Career Spy</h2>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/15 px-1.5 py-0.5 rounded">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                  isActive 
                    ? "text-primary bg-primary/[0.04] border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                }`}>
                  {isActive && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-border/60 shrink-0 space-y-2">
          <Link 
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            User Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative bg-gradient-to-br from-background via-muted/[0.01] to-muted/[0.04]">
        {children}
      </main>
    </div>
  );
}
