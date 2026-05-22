"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Loader2, Search, Building2, UserCheck, RefreshCw, Mail, 
  Sparkles, CheckCircle2, XCircle, ArrowUpRight, TrendingUp, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/companies?search=${search}`);
      setCompanies(response.data);
    } catch (error) {
      console.error("Failed to load companies", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-tr from-foreground to-muted-foreground bg-clip-text text-transparent">
             ड्रीम Company Watcher Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze target company popularity, active watchers, signal collection pipelines, and automated outreach triggers.
          </p>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center bg-card border border-border/80 p-4 rounded-2xl shadow-sm shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search company watchlist by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchCompanies} 
          disabled={loading}
          className="rounded-xl shrink-0"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table grid */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border/60 text-xs uppercase tracking-wider font-bold text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">Target Company</th>
                <th className="p-4 font-semibold">Dream Role</th>
                <th className="p-4 font-semibold">Tracked By</th>
                <th className="p-4 font-semibold">Alert State</th>
                <th className="p-4 font-semibold">Collected Signals</th>
                <th className="p-4 font-semibold">Popularity Index</th>
                <th className="p-4 font-semibold text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <span className="text-xs text-muted-foreground mt-2 block animate-pulse">Scanning targets database...</span>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground text-sm font-medium">
                    No target companies currently match criteria.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c._id} className="hover:bg-muted/15 transition group">
                    <td className="p-4 font-semibold text-foreground/90 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-primary flex items-center justify-center shrink-0 border border-indigo-500/10">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground/90">{c.companyName}</span>
                        {c.careerUrl && (
                          <a 
                            href={c.careerUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5"
                          >
                            Careers Page <ArrowUpRight className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground/80 font-medium">
                      {c.targetRole || "Any Role"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground/90 flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
                          {c.userId?.name || "Purged User"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {c.userId?.email || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {c.alertActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted/65 text-muted-foreground border border-border/80">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-foreground/90 flex items-center gap-1">
                        <Cpu className="h-4 w-4 text-muted-foreground/60" />
                        {c.signalCount} scans
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-foreground/90 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-indigo-500/80" />
                        {c.popularity} active watcher{c.popularity !== 1 && 's'}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-semibold text-right text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
