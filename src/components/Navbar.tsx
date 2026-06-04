"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NavbarContent() {
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const { isAuthenticated, user, logout } = useAuthStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "watchlist";

  const isActive = (path: string, targetTab?: string) => {
    if (pathname !== path) return false;
    if (targetTab && tab !== targetTab) return false;
    return true;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tighter text-xl text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/10">
              <Activity className="h-4.5 w-4.5 animate-pulse text-cyan-400" />
            </div>
            <span>Career<span className="text-primary">Spy</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
            {isAuthenticated && (
              <>
                <Link 
                  href="/dashboard?tab=watchlist" 
                  className={`transition-colors hover:text-foreground ${
                    isActive("/dashboard", "watchlist") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/billing" 
                  className={`transition-colors hover:text-foreground ${
                    isActive("/dashboard/billing") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Billing
                </Link>
              </>
            )}
            {user?.role === "admin" && (
              <Link 
                href="/dashboard/admin/analytics" 
                className={`transition-colors hover:text-foreground text-cyan-500 font-extrabold ${
                  isActive("/dashboard/admin/analytics") ? "text-cyan-400" : ""
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          {isAuthenticated ? (
            <div className="flex items-center gap-3.5 pl-2 border-l border-border/40">
              <span className="text-xs font-bold hidden sm:inline-block text-foreground/80">
                Hi, {user?.name || "Agent"}
              </span>
              <Button 
                variant="ghost" 
                onClick={logout} 
                className="text-xs font-bold h-8 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              >
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-border/40">
              <Button 
                variant="ghost" 
                onClick={openLoginModal} 
                className="text-xs font-bold h-8 rounded-lg hover:bg-muted/80"
              >
                Log in
              </Button>
              <Button 
                onClick={openLoginModal} 
                className="text-xs font-bold h-8 bg-primary hover:bg-primary/95 text-white rounded-lg px-4"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-lg h-16 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-black tracking-tighter text-xl text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Activity className="h-4.5 w-4.5 animate-pulse text-cyan-400" />
            </div>
            <span>Career<span className="text-primary">Spy</span></span>
          </div>
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  );
}
