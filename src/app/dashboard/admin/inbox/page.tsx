"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Loader2, Mail, Calendar, Search, Inbox, Send, LifeBuoy, 
  Clock, Check, CheckCheck, User, ShieldAlert, ArrowLeft, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { socket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";

interface SupportMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: "user" | "admin";
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface SupportConversation {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  subject: string;
  status: "open" | "pending" | "resolved";
  isReadByUser: boolean;
  isReadByAdmin: boolean;
  lastMessageAt: string;
  createdAt: string;
}

export default function AdminInboxPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadingList, setLoadingList] = useState(true);

  // Active chat state
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load ticket list
  const fetchConversations = async (resetPage = false) => {
    try {
      setLoadingList(true);
      const targetPage = resetPage ? 1 : page;
      const res = await api.get(`/admin/support/conversations?page=${targetPage}&limit=10&status=${statusFilter}`);
      setConversations(res.data.conversations);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
      if (resetPage) setPage(1);
    } catch (err) {
      console.error("Failed to load admin support inbox:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [page, statusFilter, isAuthenticated]);

  // Join admin socket room on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Join admin room
    socket.emit("admin:join", { adminId: user._id });

    const handleNewMessage = (data: { conversationId: string; message: SupportMessage }) => {
      // If we are looking at this active conversation
      if (activeConvId && data.conversationId === activeConvId) {
        setMessages((prev) => [...prev, data.message]);
        
        // Mark read
        api.patch(`/admin/support/conversations/${activeConvId}/read`).catch(console.error);
        
        // Emit read receipt back to user
        const activeConv = conversations.find(c => c._id === activeConvId);
        if (activeConv) {
          socket.emit("support:read", {
            conversationId: activeConvId,
            readerRole: "admin",
            userId: activeConv.userId._id
          });
        }
      } else {
        // Refresh sidebar
        fetchConversations();
      }
    };

    const handleTypingIndicator = (data: { conversationId: string; isTyping: boolean }) => {
      if (activeConvId && data.conversationId === activeConvId) {
        setUserIsTyping(data.isTyping);
      }
    };

    const handleReadReceipt = (data: { conversationId: string }) => {
      if (activeConvId && data.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderRole === "admin" ? { ...m, isRead: true } : m))
        );
      }
    };

    socket.on("support:new_message", handleNewMessage);
    socket.on("support:typing_indicator", handleTypingIndicator);
    socket.on("support:read_receipt", handleReadReceipt);

    return () => {
      socket.off("support:new_message", handleNewMessage);
      socket.off("support:typing_indicator", handleTypingIndicator);
      socket.off("support:read_receipt", handleReadReceipt);
    };
  }, [isAuthenticated, activeConvId, conversations, user]);

  // Auto scroll chat list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userIsTyping]);

  const selectConversation = async (convId: string) => {
    try {
      setActiveConvId(convId);
      setMessages([]);
      
      const messagesRes = await api.get(`/support/conversations/${convId}/messages`);
      setMessages(messagesRes.data);

      // Mark conversation as read by admin
      await api.patch(`/admin/support/conversations/${convId}/read`);
      
      // Refresh sidebar list counts
      const res = await api.get(`/admin/support/conversations?page=${page}&limit=10&status=${statusFilter}`);
      setConversations(res.data.conversations);

      // Notify socket
      const targetConv = conversations.find(c => c._id === convId);
      if (targetConv) {
        socket.emit("support:read", {
          conversationId: convId,
          readerRole: "admin",
          userId: targetConv.userId._id
        });
      }
    } catch (err) {
      console.error("Failed to load messages thread:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeConvId) return;

    const content = replyInput.trim();
    setReplyInput("");

    // Emit stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const activeConv = conversations.find((c) => c._id === activeConvId);
    if (activeConv) {
      socket.emit("support:typing", {
        conversationId: activeConvId,
        isTyping: false,
        recipientId: activeConv.userId._id,
        senderRole: "admin"
      });
    }
    setIsTyping(false);

    try {
      const res = await api.post(`/admin/support/conversations/${activeConvId}/messages`, { content });
      setMessages((prev) => [...prev, res.data]);
      
      // Update sidebar latest message at
      setConversations(prev =>
        prev.map((c) =>
          c._id === activeConvId ? { ...c, lastMessageAt: new Date().toISOString() } : c
        )
      );
    } catch (err) {
      console.error("Failed to send admin reply:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyInput(e.target.value);
    const activeConv = conversations.find((c) => c._id === activeConvId);
    if (!activeConv) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("support:typing", {
        conversationId: activeConvId,
        isTyping: true,
        recipientId: activeConv.userId._id,
        senderRole: "admin"
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("support:typing", {
        conversationId: activeConvId,
        isTyping: false,
        recipientId: activeConv.userId._id,
        senderRole: "admin"
      });
      setIsTyping(false);
    }, 2000);
  };

  const handleUpdateStatus = async (status: "open" | "pending" | "resolved") => {
    if (!activeConvId) return;
    try {
      const res = await api.patch(`/admin/support/conversations/${activeConvId}/status`, { status });
      // Update local state status
      setConversations((prev) =>
        prev.map((c) => (c._id === activeConvId ? { ...c, status: res.data.conversation.status } : c))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Upper header */}
      <header className="px-6 py-4.5 border-b border-border/80 bg-muted/10 flex justify-between items-center shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-extrabold text-foreground/95 flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            Support Conversations Inbox
          </h1>
          <span className="text-xs text-muted-foreground">Manage user support tickets, help outreach pipelines, and live chat</span>
        </div>
        
        <div className="flex gap-2">
          {["all", "open", "pending", "resolved"].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                statusFilter === filter
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Main Split Window */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: LIST OF CONVERSATIONS */}
        <div className="w-96 border-r border-border/85 flex flex-col h-full bg-muted/5 shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {loadingList && conversations.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading inbox lists...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center p-6 text-muted-foreground gap-2">
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
                <span className="text-sm font-semibold">Inbox is clear</span>
                <span className="text-xs max-w-[200px] leading-relaxed">No support threads match the selected filter.</span>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = activeConvId === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => selectConversation(c._id)}
                    className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-2 relative ${
                      isActive
                        ? "border-primary bg-primary/[0.04] shadow-sm font-semibold"
                        : !c.isReadByAdmin
                        ? "border-primary/30 bg-primary/[0.01] font-bold"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    {!c.isReadByAdmin && (
                      <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    )}
                    
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-foreground/90 font-bold truncate max-w-[65%]">
                        {c.userId?.name || "Purged User"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider ${
                        c.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <h4 className="text-xs text-muted-foreground line-clamp-1">
                      {c.subject}
                    </h4>

                    <span className="text-[9px] text-muted-foreground/50 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Activity: {new Date(c.lastMessageAt).toLocaleString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Left panel pagination footer */}
          <div className="p-3 border-t border-border/80 bg-muted/10 flex justify-between items-center text-[10px] text-muted-foreground font-bold shrink-0">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loadingList}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="h-7 text-[10px] py-1 px-2.5"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loadingList}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="h-7 text-[10px] py-1 px-2.5"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION MESSAGES AND REPLIES */}
        <div className="flex-1 flex flex-col h-full bg-card relative overflow-hidden">
          {activeConvId ? (
            <>
              {/* Message Pane Header */}
              {(() => {
                const activeConv = conversations.find(c => c._id === activeConvId);
                return activeConv ? (
                  <div className="px-6 py-4.5 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
                    <div className="flex flex-col gap-0.5 max-w-[60%]">
                      <h3 className="font-extrabold text-sm text-foreground/90 truncate">{activeConv.subject}</h3>
                      <span className="text-xs text-muted-foreground truncate">
                        User: <strong className="text-foreground/75 font-semibold">{activeConv.userId?.name}</strong> ({activeConv.userId?.email})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-muted-foreground mr-1">Status:</span>
                      {["open", "pending", "resolved"].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(st as any)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition ${
                            activeConv.status === st
                              ? st === "resolved"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-background hover:bg-muted text-muted-foreground border-border/80"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Chat Thread Panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => {
                  const isSelf = msg.senderRole === "admin";
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex gap-2.5 max-w-[80%] ${isSelf ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`h-8.5 w-8.5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          isSelf ? "bg-gradient-to-tr from-primary to-indigo-600 text-white" : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                        }`}
                      >
                        {isSelf ? <User className="h-4 w-4" /> : <LifeBuoy className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <div
                          className={`p-3.5 rounded-2xl text-sm border ${
                            isSelf
                              ? "bg-primary text-white border-primary/20 rounded-tr-none shadow-md"
                              : "bg-muted/40 border-border/50 rounded-tl-none text-foreground/90"
                          }`}
                        >
                          <span>{msg.content}</span>
                        </div>
                        {isSelf && idx === messages.length - 1 && (
                          <div className="text-[10px] text-muted-foreground/60 flex items-center justify-end gap-1 mt-0.5">
                            {msg.isRead ? (
                              <span className="flex items-center gap-0.5 text-indigo-500">
                                <CheckCheck className="h-3 w-3" />
                                Read
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Check className="h-3 w-3" />
                                Delivered
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {userIsTyping && (
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <LifeBuoy className="h-4 w-4" />
                    </div>
                    <div className="p-3 rounded-2xl bg-muted rounded-tl-sm text-sm flex items-center gap-1 border border-border/30">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Reply box */}
              {(() => {
                const activeConv = conversations.find(c => c._id === activeConvId);
                return activeConv ? (
                  <div className="p-4 border-t border-border bg-card shrink-0">
                    {activeConv.status === "resolved" ? (
                      <div className="p-3 bg-muted/65 rounded-xl text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-emerald-500" />
                        This support request is Resolved. Reopen ticket status to type a response.
                      </div>
                    ) : (
                      <form onSubmit={handleSendReply} className="flex gap-2">
                        <Input
                          placeholder="Type a support reply response..."
                          value={replyInput}
                          onChange={handleInputChange}
                          className="rounded-full bg-muted/30 border-border focus-visible:ring-1"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="rounded-full shrink-0 bg-primary hover:bg-primary/95 text-white"
                          disabled={!replyInput.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                ) : null;
              })()}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-3">
              <div className="h-16 w-16 bg-muted/40 rounded-full flex items-center justify-center text-muted-foreground/30">
                <Inbox className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-foreground">Support Ticket Center</h3>
              <p className="text-xs max-w-xs leading-relaxed text-muted-foreground/75">
                Select a ticket thread from the left pane to check user inquiries and answer them in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
