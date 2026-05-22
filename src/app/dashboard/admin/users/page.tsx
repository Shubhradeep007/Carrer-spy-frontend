"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Loader2, Search, Trash2, ShieldAlert, KeyRound, 
  Building, Bell, RefreshCw, X, ShieldCheck, Mail, Calendar, Eye
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // User Details drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action loaders
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?page=${page}&limit=10&search=${search}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setPage(response.data.page);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const loadUserDetails = async (id: string) => {
    try {
      setSelectedUserId(id);
      setLoadingDetails(true);
      setUserDetails(null);
      const res = await api.get(`/admin/users/${id}`);
      setUserDetails(res.data);
    } catch (err) {
      console.error("Failed to load user details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBanToggle = async (userId: string) => {
    try {
      setActionLoading(`ban-${userId}`);
      const res = await api.patch(`/admin/users/${userId}/ban`);
      setSuccessMessage(res.data.message);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: res.data.user.isBanned } : u));
      if (userDetails && userDetails.user._id === userId) {
        setUserDetails((prev: any) => ({
          ...prev,
          user: { ...prev.user, isBanned: res.data.user.isBanned }
        }));
      }
    } catch (err) {
      console.error("Failed to toggle ban:", err);
    } finally {
      setActionLoading(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password? A random temporary password will be generated and emailed to them immediately.")) return;
    
    try {
      setActionLoading(`reset-${userId}`);
      const res = await api.patch(`/admin/users/${userId}/reset-password`);
      setSuccessMessage(res.data.message);
    } catch (err) {
      console.error("Failed to reset password:", err);
    } finally {
      setActionLoading(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("🚨 WARNING: Are you sure you want to delete this user? This will permanently purge their account, watchlist targets, collected signals, alert dispatch logs, and support chat transcripts. This action is irreversible!")) return;

    try {
      setActionLoading(`delete-${userId}`);
      const res = await api.delete(`/admin/users/${userId}`);
      setSuccessMessage(res.data.message);
      
      // Close details panel if active
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setUserDetails(null);
      }
      
      // Refresh list
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text text-transparent">
            User Account Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse registered job seekers, review real-time alerts history, reset credentials, or restrict access.
          </p>
        </div>
      </header>

      {/* Success banner notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center bg-card border border-border/80 p-4 rounded-2xl shadow-sm shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email Address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 rounded-xl"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchUsers} 
          disabled={loading}
          className="rounded-xl shrink-0"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table grid list */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border/60 text-xs uppercase tracking-wider font-bold text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">User details</th>
                <th className="p-4 font-semibold">Targets Watchlist</th>
                <th className="p-4 font-semibold">Alerts Sent</th>
                <th className="p-4 font-semibold">Account State</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <span className="text-xs text-muted-foreground mt-2 block animate-pulse">Scanning users database...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm font-medium">
                    No users match search criterion.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/15 transition group">
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground/90">{u.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-foreground/80 font-semibold">
                        <Building className="h-4 w-4 text-muted-foreground/60" />
                        {u.companyCount} target{u.companyCount !== 1 && 's'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-foreground/80 font-semibold">
                        <Bell className="h-4 w-4 text-muted-foreground/60" />
                        {u.alertCount} triggers
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.isBanned 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => loadUserDetails(u._id)} 
                          title="View user details & analytics"
                          className="rounded-lg h-8 w-8 text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={actionLoading !== null}
                          onClick={() => handleBanToggle(u._id)} 
                          title={u.isBanned ? 'Unban Account' : 'Suspend Account'}
                          className={`rounded-lg h-8 w-8 ${
                            u.isBanned ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-amber-500 hover:bg-amber-500/10'
                          }`}
                        >
                          {actionLoading === `ban-${u._id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.isBanned ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <ShieldAlert className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={actionLoading !== null}
                          onClick={() => handleResetPassword(u._id)} 
                          title="Generate Temporary Credentials"
                          className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          {actionLoading === `reset-${u._id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={actionLoading !== null}
                          onClick={() => handleDeleteUser(u._id)} 
                          title="Purge user files"
                          className="rounded-lg h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                        >
                          {actionLoading === `delete-${u._id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="bg-muted/20 px-4 py-3.5 border-t border-border/60 flex justify-between items-center text-xs text-muted-foreground font-semibold">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="rounded-lg text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              className="rounded-lg text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* USER DETAILS SLIDEOVER SIDE DRAWER */}
      <AnimatePresence>
        {selectedUserId && (
          <>
            {/* Backdrop cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserId(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
            />

            {/* Slideover panel drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-[550px] max-w-full bg-card border-l border-border/80 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border/60 flex justify-between items-center bg-muted/20 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-extrabold text-lg text-foreground/90">User Diagnostic View</h3>
                  <span className="text-xs text-muted-foreground">Detailed watcher analysis and dispatch history</span>
                </div>
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDetails ? (
                  <div className="h-60 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !userDetails ? (
                  <div className="text-center text-sm text-rose-500 py-10 font-semibold">
                    Failed to fetch profile metadata.
                  </div>
                ) : (
                  <>
                    {/* User General profile */}
                    <section className="bg-muted/30 border border-border/40 p-4.5 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-foreground">{userDetails.user.name}</span>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-1">
                            <Mail className="h-3.5 w-3.5" />
                            {userDetails.user.email}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Joined on {new Date(userDetails.user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          userDetails.user.isBanned 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {userDetails.user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2.5 mt-2">
                        <Button 
                          size="sm"
                          onClick={() => handleBanToggle(userDetails.user._id)}
                          className={`font-semibold text-xs rounded-xl flex-1 ${
                            userDetails.user.isBanned ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          {userDetails.user.isBanned ? 'Unban Account' : 'Restrict Account'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(userDetails.user._id)}
                          className="font-semibold text-xs rounded-xl flex-1"
                        >
                          Reset Credentials
                        </Button>
                      </div>
                    </section>

                    {/* Watched Companies Tracker */}
                    <section className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary" />
                        Target Watchlist Tracker ({userDetails.watchedCompanies.length})
                      </h4>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {userDetails.watchedCompanies.length === 0 ? (
                          <div className="text-center p-6 text-xs text-muted-foreground border border-dashed rounded-xl">
                            Watching no dream companies yet.
                          </div>
                        ) : (
                          userDetails.watchedCompanies.map((c: any) => (
                            <div key={c._id} className="p-3.5 bg-muted/20 border border-border/40 rounded-xl flex justify-between items-center">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-sm text-foreground/90">{c.companyName}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  Role: <strong className="text-foreground/70">{c.targetRole || 'Any'}</strong>
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {c.latestSignal ? (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    c.latestSignal.hireScore >= 70 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15' :
                                    c.latestSignal.hireScore >= 40 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' :
                                    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/15'
                                  }`}>
                                    Score: {c.latestSignal.hireScore}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/60 italic font-semibold">
                                    No scan yet
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    {/* Email Alerts Dispatch History */}
                    <section className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-rose-500" />
                        Outbound Alert History ({userDetails.alerts.length})
                      </h4>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {userDetails.alerts.length === 0 ? (
                          <div className="text-center p-6 text-xs text-muted-foreground border border-dashed rounded-xl">
                            No hiring alert dispatches sent to user.
                          </div>
                        ) : (
                          userDetails.alerts.map((a: any) => (
                            <div key={a._id} className="p-3.5 bg-muted/20 border border-border/40 rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-foreground/80">
                                  {a.companyId?.companyName || 'Removed target'}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {new Date(a.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2">
                                <span className="text-muted-foreground font-medium">Trigger Score: {a.hireScore}/100</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  a.status === 'sent' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' 
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                                }`}>
                                  {a.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
