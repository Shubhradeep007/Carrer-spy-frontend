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

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("notification:new");
    };
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    if (!id) return;
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

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
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n, i) => (
                <div 
                  key={n._id || i} 
                  onClick={() => handleMarkOneRead(n._id)}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer text-left ${!n.isRead ? 'bg-primary/[0.03] border-l-2 border-primary' : 'pl-4.5'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-xs ${!n.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{n.title}</h4>
                    {!n.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">{n.message}</p>
                  <span className="text-[9px] text-muted-foreground/60 mt-2 block font-medium">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
