"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";

export function Navbar() {
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tighter text-xl">
            <Search className="h-5 w-5" />
            CareerSpy
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            {user?.role === "admin" && (
              <Link href="/dashboard/admin/analytics" className="hover:text-foreground transition-colors text-primary font-bold">
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationBell />
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline-block">
                Hi, {user?.name || "User"}
              </span>
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={openLoginModal}>
                Log in
              </Button>
              <Button onClick={openLoginModal}>Sign up</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
