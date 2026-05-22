"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Loader2, Plus, Megaphone, Trash2, Edit, Calendar, 
  CheckCircle2, XCircle, X, ShieldAlert, Sparkles, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";

interface Notice {
  _id: string;
  title: string;
  message: string;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Notice alert lists banner
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/notices");
      setNotices(res.data);
    } catch (err) {
      console.error("Failed to load notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedNoticeId(null);
    setFormTitle("");
    setFormMessage("");
    setFormExpiresAt("");
    setFormIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (notice: Notice) => {
    setModalMode("edit");
    setSelectedNoticeId(notice._id);
    setFormTitle(notice.title);
    setFormMessage(notice.message);
    setFormExpiresAt(notice.expiresAt ? new Date(notice.expiresAt).toISOString().split('T')[0] : "");
    setFormIsActive(notice.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        isActive: formIsActive
      };

      if (modalMode === "create") {
        await api.post("/admin/notices", payload);
        setSuccessMessage("Announcement published successfully!");
      } else {
        await api.patch(`/admin/notices/${selectedNoticeId}`, payload);
        setSuccessMessage("Announcement updated successfully!");
      }

      setShowModal(false);
      fetchNotices();
    } catch (err) {
      console.error("Failed to process notice submission:", err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice? Users will immediately lose access to it on their dashboards.")) return;

    try {
      await api.delete(`/admin/notices/${id}`);
      setSuccessMessage("Announcement removed successfully.");
      fetchNotices();
    } catch (err) {
      console.error("Failed to delete notice:", err);
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleToggleActive = async (notice: Notice) => {
    try {
      await api.patch(`/admin/notices/${notice._id}`, { isActive: !notice.isActive });
      setSuccessMessage(`Notice ${!notice.isActive ? 'activated' : 'deactivated'} successfully.`);
      fetchNotices();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text text-transparent">
            System Notice Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Broadcast service updates, quota warnings, server maintenance schedules, or career tips to all registered user dashboards.
          </p>
        </div>
        
        <Button 
          onClick={openCreateModal}
          className="gap-2 shrink-0 rounded-xl shadow-lg shadow-primary/10 font-bold text-sm"
        >
          <Plus className="h-5 w-5" />
          Publish Notice
        </Button>
      </header>

      {/* Action Banners */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid displaying existing notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground mt-2 block animate-pulse">Pulling announcements logs...</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card border border-dashed rounded-2xl flex flex-col items-center justify-center p-8">
            <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">Broadcast channels quiet</p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
              Publish service notices, alerts downtime warning updates, or platform release notes.
            </p>
          </div>
        ) : (
          notices.map((n) => {
            const isExpired = n.expiresAt ? new Date(n.expiresAt) < new Date() : false;
            return (
              <motion.div
                key={n._id}
                layout
                className={`bg-card border rounded-2xl p-5.5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-5 relative overflow-hidden ${
                  n.isActive && !isExpired 
                    ? "border-primary/20 bg-primary/[0.005]" 
                    : "border-border/60 bg-muted/10 opacity-75"
                }`}
              >
                {/* Visual Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  n.isActive && !isExpired ? 'bg-primary' : 'bg-muted-foreground/40'
                }`} />

                <div className="space-y-3">
                  <div className="flex justify-between items-start pl-2">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-extrabold text-base text-foreground/90">{n.title}</h3>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        By {n.createdBy?.name || "System Admin"} on {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        n.isActive && !isExpired
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                          : "bg-muted/70 text-muted-foreground border border-border"
                      }`}>
                        {n.isActive && !isExpired ? "Broadcast" : "Inactive"}
                      </span>
                      {n.expiresAt && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isExpired 
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/15" 
                            : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15"
                        }`}>
                          {isExpired ? "Expired" : "Scheduled"}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground/90 pl-2 whitespace-pre-line">
                    {n.message}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4 flex items-center justify-between text-xs pl-2">
                  <span className="text-muted-foreground/70 font-semibold flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Expires: {n.expiresAt ? new Date(n.expiresAt).toLocaleDateString() : "Never"}
                  </span>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(n)}
                      className={`text-xs font-semibold rounded-lg ${
                        n.isActive ? "text-amber-500 hover:bg-amber-500/10" : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                    >
                      {n.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(n)}
                      className="text-primary hover:bg-primary/10 rounded-lg"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(n._id)}
                      className="text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ANNOUNCEMENT CRUD MODAL DIALOG */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Content card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/80 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col z-10 relative"
            >
              <div className="p-5 border-b border-border/60 flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary animate-bounce" />
                  <h3 className="font-extrabold text-base text-foreground/90">
                    {modalMode === "create" ? "Create Broadcast Notice" : "Edit Broadcast Notice"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Announcement Title
                  </label>
                  <Input
                    required
                    placeholder="e.g. Server Maintenance, Gemini 2.5 flash quota alerts"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Broadcasting Content Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Provide details about the platform notice..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      Expiration Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-2 cursor-pointer py-3">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0"
                      />
                      Active Broadcast
                    </label>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="font-semibold text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="font-semibold text-xs rounded-xl px-5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : modalMode === "create" ? (
                      "Publish Announcement"
                    ) : (
                      "Save Updates"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
