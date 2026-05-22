"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, History, Plus, LifeBuoy, AlertCircle, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  _id?: string;
  createdAt?: string;
}

interface ChatSession {
  _id: string;
  updatedAt: string;
  messages: ChatMessage[];
}

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
  userId: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  isReadByUser: boolean;
  isReadByAdmin: boolean;
  lastMessageAt: string;
  createdAt: string;
}

export function ChatWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "support">("ai");

  // AI Chat States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Support Chat States
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminIsTyping, setAdminIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Support Ticket Form
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketInitialMsg, setTicketInitialMsg] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supportMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (activeTab === "ai") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      supportMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, supportMessages, isAiStreaming, adminIsTyping, activeTab, isOpen]);

  // Load chat history & support tickets on mount/auth changes
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadChatSessions();
      loadSupportTickets();
    }
  }, [isAuthenticated, isOpen]);

  // Register Socket.io listeners for support chat
  useEffect(() => {
    if (!isAuthenticated) return;

    // Join user socket room
    socket.emit("join_room", { userId: user?._id });

    const handleNewMessage = (data: { conversationId: string; message: SupportMessage }) => {
      // If we are currently viewing this ticket, add message and mark read
      if (activeTicketId && data.conversationId === activeTicketId) {
        setSupportMessages((prev) => [...prev, data.message]);
        
        // Mark read API call
        api.patch(`/support/conversations/${activeTicketId}/read`).catch(console.error);
        
        // Notify socket
        socket.emit("support:read", {
          conversationId: activeTicketId,
          readerRole: "user",
          userId: user?._id
        });
      } else {
        // Refresh ticket list to show unread dot
        loadSupportTickets();
      }
    };

    const handleTypingIndicator = (data: { conversationId: string; isTyping: boolean }) => {
      if (activeTicketId && data.conversationId === activeTicketId) {
        setAdminIsTyping(data.isTyping);
      }
    };

    const handleStatusUpdate = (data: { conversationId: string; status: SupportConversation["status"] }) => {
      setSupportConversations((prev) =>
        prev.map((c) => (c._id === data.conversationId ? { ...c, status: data.status } : c))
      );
    };

    socket.on("support:new_message", handleNewMessage);
    socket.on("support:typing_indicator", handleTypingIndicator);
    socket.on("support:status_update", handleStatusUpdate);

    return () => {
      socket.off("support:new_message", handleNewMessage);
      socket.off("support:typing_indicator", handleTypingIndicator);
      socket.off("support:status_update", handleStatusUpdate);
    };
  }, [isAuthenticated, activeTicketId, user?._id]);

  // --- AI Chat Actions ---

  const loadChatSessions = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/chat/history");
      setSessions(res.data);
      setLoadingHistory(false);
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setLoadingHistory(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    try {
      setShowHistory(false);
      const res = await api.get(`/chat/history/${sessionId}`);
      setCurrentSessionId(res.data._id);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Failed to load session messages:", err);
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your Career Spy AI. I analyze your target company tracker, outreach notes, and signals in real-time. How can I help you stand out today?"
      }
    ]);
    setShowHistory(false);
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiStreaming) return;

    const userQuery = inputMessage.trim();
    setInputMessage("");

    // Append user message immediately
    const updatedMessages = [...messages, { role: "user", content: userQuery } as ChatMessage];
    setMessages(updatedMessages);
    setIsAiStreaming(true);

    // Add placeholder assistant message that we will stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = Cookies.get("token") || localStorage.getItem("token");
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${baseURL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: userQuery, sessionId: currentSessionId })
      });

      if (!response.ok) {
        throw new Error("Failed to initialize SSE stream");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Stream reader not supported");

      let fullText = "";
      let activeSessionId = currentSessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // SSE formatting has lines like `data: { ... }\n\n`
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;
              const parsed = JSON.parse(dataStr);

              if (parsed.text) {
                fullText += parsed.text;
                // Update the last assistant message with cumulative streamed response
                setMessages((prev) => {
                  const copy = [...prev];
                  if (copy.length > 0) {
                    copy[copy.length - 1] = { role: "assistant", content: fullText };
                  }
                  return copy;
                });
              }

              if (parsed.done && parsed.sessionId) {
                activeSessionId = parsed.sessionId;
                setCurrentSessionId(parsed.sessionId);
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore partial parsing errors or json decode failures from stream split
            }
          }
        }
      }

      // Re-load list of sessions to reflect the updated or new session name
      loadChatSessions();

    } catch (error: any) {
      console.error("AI Chat Stream error:", error);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠️ Failed to get AI response: ${error.message || "Interrupted Connection"}`
          };
        }
        return copy;
      });
    } finally {
      setIsAiStreaming(false);
    }
  };

  // --- Support Chat Actions ---

  const loadSupportTickets = async () => {
    try {
      setLoadingSupport(true);
      const res = await api.get("/support/conversations");
      setSupportConversations(res.data);
      setLoadingSupport(false);
    } catch (err) {
      console.error("Failed to load support tickets:", err);
      setLoadingSupport(false);
    }
  };

  const selectTicket = async (ticketId: string) => {
    try {
      setActiveTicketId(ticketId);
      setSupportMessages([]);
      const messagesRes = await api.get(`/support/conversations/${ticketId}/messages`);
      setSupportMessages(messagesRes.data);

      // Mark read
      await api.patch(`/support/conversations/${ticketId}/read`);
      loadSupportTickets(); // Refresh counts

      // Emit read receipt to admin
      socket.emit("support:read", {
        conversationId: ticketId,
        readerRole: "user",
        userId: user?._id
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim() || !activeTicketId) return;

    const content = supportInput.trim();
    setSupportInput("");

    // Emit stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("support:typing", {
      conversationId: activeTicketId,
      isTyping: false,
      senderRole: "user"
    });
    setIsTyping(false);

    try {
      const res = await api.post(`/support/conversations/${activeTicketId}/messages`, { content });
      setSupportMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Failed to send support message:", err);
    }
  };

  const handleSupportInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupportInput(e.target.value);
    if (!activeTicketId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("support:typing", {
        conversationId: activeTicketId,
        isTyping: true,
        senderRole: "user"
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("support:typing", {
        conversationId: activeTicketId,
        isTyping: false,
        senderRole: "user"
      });
      setIsTyping(false);
    }, 2000);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketInitialMsg.trim()) return;

    setCreatingTicket(true);
    try {
      const res = await api.post("/support/conversations", {
        subject: ticketSubject.trim(),
        initialMessage: ticketInitialMsg.trim()
      });

      setTicketSubject("");
      setTicketInitialMsg("");
      setShowCreateTicket(false);
      
      // Load and open the newly created ticket
      await loadSupportTickets();
      selectTicket(res.data.conversation._id);
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setCreatingTicket(false);
    }
  };

  // Determine user unread status
  const supportHasUnread = supportConversations.some((c) => !c.isReadByUser);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-tr from-primary to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group hover:shadow-indigo-500/20`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare className="h-6 w-6" />
              {supportHasUnread && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Main Chat Widget Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border/80 shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden backdrop-blur-md"
            style={{ height: "550px", maxHeight: "80vh" }}
          >
            {/* Header Tabs */}
            <div className="flex border-b border-border bg-muted/40 p-1.5 gap-1 shrink-0">
              <button
                onClick={() => {
                  setActiveTab("ai");
                  setShowHistory(false);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  activeTab === "ai"
                    ? "bg-background text-primary shadow-sm border border-border/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Bot className="h-4 w-4" />
                AI Career Agent
              </button>
              <button
                onClick={() => setActiveTab("support")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 relative ${
                  activeTab === "support"
                    ? "bg-background text-primary shadow-sm border border-border/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <LifeBuoy className="h-4 w-4" />
                Support Chat
                {supportHasUnread && (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
            </div>

            {/* TAB CONTENT: AI Chat */}
            {activeTab === "ai" && (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* AI Sub-Header / Controls */}
                <div className="px-4 py-2 bg-muted/20 border-b border-border/60 flex justify-between items-center text-xs shrink-0">
                  <span className="font-semibold text-muted-foreground">
                    {currentSessionId ? "Active AI Session" : "New AI Conversation"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-1 py-1 px-2 rounded-md border border-border hover:bg-muted text-muted-foreground transition"
                    >
                      <History className="h-3.5 w-3.5" />
                      History
                    </button>
                    <button
                      onClick={startNewSession}
                      className="flex items-center gap-1 py-1 px-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </button>
                  </div>
                </div>

                {/* History Drawer Overlay */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="absolute inset-0 bg-background/95 z-10 flex flex-col p-4 overflow-y-auto"
                    >
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" />
                          Conversation History
                        </h4>
                        <button
                          onClick={() => setShowHistory(false)}
                          className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {loadingHistory ? (
                        <div className="flex-1 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                          <Bot className="h-10 w-10 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground font-medium">No previous sessions found</p>
                          <p className="text-xs text-muted-foreground/75 mt-1">Start chatting with Gemini now!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sessions.map((s) => {
                            const lastMsg = s.messages[s.messages.length - 1];
                            const firstMsg = s.messages[0];
                            const preview = lastMsg?.content || firstMsg?.content || "Empty chat";

                            return (
                              <button
                                key={s._id}
                                onClick={() => selectSession(s._id)}
                                className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                                  s._id === currentSessionId
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                }`}
                              >
                                <span className="text-xs font-semibold text-foreground/90 truncate">
                                  {firstMsg?.content || "Career Assistant Session"}
                                </span>
                                <span className="text-[11px] text-muted-foreground line-clamp-1">
                                  {preview}
                                </span>
                                <span className="text-[9px] text-muted-foreground/60 mt-1">
                                  {new Date(s.updatedAt).toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Message Stream list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          msg.role === "user"
                            ? "bg-gradient-to-tr from-primary to-indigo-600 text-white"
                            : "bg-indigo-500/10 text-primary"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                          msg.role === "user"
                            ? "bg-primary text-white border-primary/20 rounded-tr-none shadow-md"
                            : "bg-muted/40 border-border/50 rounded-tl-none text-foreground/90"
                        }`}
                      >
                        {msg.content === "" && isAiStreaming && idx === messages.length - 1 ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            Thinking...
                          </span>
                        ) : (
                          <span className="whitespace-pre-line">{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAiStreaming &&
                    messages[messages.length - 1]?.content !== "" && (
                      <div className="flex gap-2 max-w-[85%]">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-primary flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 animate-pulse" />
                        </div>
                        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 rounded-tl-none text-sm flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 bg-primary/75 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-primary/75 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-primary/75 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </div>

                {/* AI Input Form */}
                <div className="p-3 border-t border-border bg-card shrink-0">
                  <form onSubmit={handleSendAi} className="flex gap-2">
                    <Input
                      placeholder="Ask about target companies, score alerts..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={isAiStreaming}
                      className="rounded-full bg-muted/30 border-border focus-visible:ring-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full shrink-0 bg-primary hover:bg-primary/95 text-white"
                      disabled={!inputMessage.trim() || isAiStreaming}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Support Ticket Chat */}
            {activeTab === "support" && (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTicketId ? (
                  /* active support session messages list */
                  <div className="flex-grow flex flex-col overflow-hidden">
                    {/* Header bar */}
                    <div className="px-3 py-2 bg-muted/30 border-b border-border/60 flex items-center gap-2 shrink-0 text-xs">
                      <button
                        onClick={() => {
                          setActiveTicketId(null);
                          loadSupportTickets();
                        }}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground flex items-center gap-1 transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Inbox
                      </button>
                      <span className="font-semibold text-foreground/80 truncate">
                        {
                          supportConversations.find((c) => c._id === activeTicketId)
                            ?.subject
                        }
                      </span>
                      <span
                        className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          supportConversations.find((c) => c._id === activeTicketId)
                            ?.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {
                          supportConversations.find((c) => c._id === activeTicketId)
                            ?.status
                        }
                      </span>
                    </div>

                    {/* Messages panel */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      {supportMessages.map((msg, idx) => {
                        const isSelf = msg.senderRole === "user";
                        return (
                          <div
                            key={msg._id || idx}
                            className={`flex gap-2 max-w-[85%] ${
                              isSelf ? "ml-auto flex-row-reverse" : ""
                            }`}
                          >
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                                isSelf
                                  ? "bg-gradient-to-tr from-primary to-indigo-600 text-white"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {isSelf ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <LifeBuoy className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div
                                className={`p-3.5 rounded-2xl text-sm border ${
                                  isSelf
                                    ? "bg-primary text-white border-primary/20 rounded-tr-none shadow-md"
                                    : "bg-muted/40 border-border/50 rounded-tl-none text-foreground/90"
                                }`}
                              >
                                <span>{msg.content}</span>
                              </div>
                              {/* Read Receipts */}
                              {isSelf && idx === supportMessages.length - 1 && (
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

                      {adminIsTyping && (
                        <div className="flex gap-2 max-w-[85%]">
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
                      <div ref={supportMessagesEndRef} />
                    </div>

                    {/* Footer sending container */}
                    <div className="p-3 border-t border-border bg-card shrink-0">
                      {supportConversations.find((c) => c._id === activeTicketId)
                        ?.status === "resolved" ? (
                        <div className="p-2 bg-muted/50 rounded-xl text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <AlertCircle className="h-4 w-4 text-emerald-500" />
                          This support ticket is marked as Resolved.
                        </div>
                      ) : (
                        <form onSubmit={handleSendSupport} className="flex gap-2">
                          <Input
                            placeholder="Type a support reply..."
                            value={supportInput}
                            onChange={handleSupportInputChange}
                            className="rounded-full bg-muted/30 border-border focus-visible:ring-1"
                          />
                          <Button
                            type="submit"
                            size="icon"
                            className="rounded-full shrink-0 bg-primary hover:bg-primary/95 text-white"
                            disabled={!supportInput.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ) : showCreateTicket ? (
                  /* Create New Ticket Panel Form */
                  <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <LifeBuoy className="h-4 w-4 text-primary" />
                        Open Support Ticket
                      </h4>
                      <button
                        onClick={() => setShowCreateTicket(false)}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateTicketSubmit} className="flex-1 flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Subject / Topic
                        </label>
                        <Input
                          required
                          placeholder="e.g. Resume analysis fails, Alert delays"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Detailed Message
                        </label>
                        <textarea
                          required
                          placeholder="Explain what is going wrong or how our admins can assist you..."
                          value={ticketInitialMsg}
                          onChange={(e) => setTicketInitialMsg(e.target.value)}
                          className="flex-1 min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={creatingTicket}
                        className="w-full mt-2 font-semibold"
                      >
                        {creatingTicket ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating Ticket...
                          </>
                        ) : (
                          "Submit Support Request"
                        )}
                      </Button>
                    </form>
                  </div>
                ) : (
                  /* Conversations List Inbox View */
                  <div className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border/60 flex justify-between items-center shrink-0">
                      <span className="text-sm font-semibold text-foreground/80">
                        Support Inbox
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setShowCreateTicket(true)}
                        className="gap-1 text-xs font-semibold rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create Ticket
                      </Button>
                    </div>

                    {loadingSupport ? (
                      <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : supportConversations.length === 0 ? (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                        <LifeBuoy className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">
                          No active support tickets
                        </p>
                        <p className="text-xs text-muted-foreground/75 mt-1 max-w-[200px]">
                          Need help with watched companies, API rates, or outreach? Drop a message to admins.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-grow overflow-y-auto p-3 space-y-2">
                        {supportConversations.map((c) => (
                          <button
                            key={c._id}
                            onClick={() => selectTicket(c._id)}
                            className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1.5 relative ${
                              !c.isReadByUser
                                ? "border-primary bg-primary/[0.03] shadow-sm font-semibold"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            {!c.isReadByUser && (
                              <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-foreground/90 truncate max-w-[70%]">
                                {c.subject}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  c.status === "resolved"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>
                            <span className="text-[9px] text-muted-foreground/60">
                              Last Activity: {new Date(c.lastMessageAt).toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
