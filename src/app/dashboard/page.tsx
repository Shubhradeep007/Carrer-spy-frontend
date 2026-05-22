"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSpyStore } from "@/store/useSpyStore";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CompanyChart } from "@/components/CompanyChart";
import { Loader2, Plus, Trash2, Building, Activity, ShieldAlert, Target } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { companies, isLoading, fetchCompanies, addCompany, deleteCompany, updateSignalRealtime } = useSpyStore();
  
  const [newCompany, setNewCompany] = useState({ companyName: "", targetRole: "", careerUrl: "", githubOrg: "" });

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
      
      // Socket connection
      socket.connect();
      socket.emit("join_room", { userId: user?._id });

      socket.on("signal:updated", (data) => {
        updateSignalRealtime(data.companyId, { hireScore: data.hireScore, verdict: data.verdict });
      });

      return () => {
        socket.off("signal:updated");
      };
    }
  }, [isAuthenticated, user, fetchCompanies, updateSignalRealtime]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.companyName) return;
    await addCompany(newCompany);
    setNewCompany({ companyName: "", targetRole: "", careerUrl: "", githubOrg: "" });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
        Please log in to view your Spy Dashboard.
      </div>
    );
  }

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case "HOT": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "WARM": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "COLD": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Career Spy Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time job intelligence for your dream companies.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content - Company Cards */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Your Watchlist
          </h2>
          
          {isLoading && companies.length === 0 ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-xl bg-muted/30">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No companies watched</h3>
              <p className="text-muted-foreground text-sm mt-1">Add your first dream company to start spying.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {companies.map((c) => (
                <div key={c._id} className="relative group overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {c.companyName}
                        {c.latestSignal && (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getVerdictColor(c.latestSignal.verdict)}`}>
                            {c.latestSignal.verdict}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Target className="h-3 w-3" /> Target: {c.targetRole || "Any Role"}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-black tracking-tighter">
                        {c.latestSignal?.hireScore !== undefined ? c.latestSignal.hireScore : "-"}
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hire Score</p>
                    </div>
                  </div>
                  
                  {c.latestSignal && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/50 border text-sm">
                      <p className="font-medium flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        {c.latestSignal.aiSummary || "Signals processing..."}
                      </p>
                    </div>
                  )}

                  <CompanyChart companyId={c._id} />

                  <button 
                    onClick={() => deleteCompany(c._id)}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full border shadow-sm"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Add Company */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Add Company</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Company Name *</label>
                <Input 
                  placeholder="e.g. Google, Stripe" 
                  value={newCompany.companyName}
                  onChange={(e) => setNewCompany({...newCompany, companyName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Target Role</label>
                <Input 
                  placeholder="e.g. Frontend Engineer" 
                  value={newCompany.targetRole}
                  onChange={(e) => setNewCompany({...newCompany, targetRole: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Careers Page URL</label>
                <Input 
                  placeholder="https://careers.google.com" 
                  value={newCompany.careerUrl}
                  onChange={(e) => setNewCompany({...newCompany, careerUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">GitHub Organization</label>
                <Input 
                  placeholder="e.g. google" 
                  value={newCompany.githubOrg}
                  onChange={(e) => setNewCompany({...newCompany, githubOrg: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!newCompany.companyName || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Start Spying</>}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              We will scan Adzuna, NewsAPI, GitHub, and their careers page every hour.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
