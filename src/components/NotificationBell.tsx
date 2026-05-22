"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

export function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    
    // In a real implementation we would fetch this from /api/notifications
    // fetchNotifications();

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("notification:new");
    };
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <button className="text-xs text-primary hover:underline">Mark all read</button>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`p-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <h4 className="text-sm font-semibold">{n.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
