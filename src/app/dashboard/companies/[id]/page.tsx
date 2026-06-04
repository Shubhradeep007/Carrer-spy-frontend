"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/useAuthStore";
import { CompanyChart } from "@/components/CompanyChart";
import { 
  ArrowLeft, Loader2, Target, Bell, BellOff, Trash2, 
  Sparkles, Briefcase, Activity, Calendar, ExternalLink, 
  Copy, Check, ShieldAlert, Award, FileText, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface CompanyDetail {
  _id: string;
  companyName: string;
  careerUrl?: string;
  githubOrg?: string;
  targetRole?: string;
  alertActive: boolean;
  latestSignal?: {
    hireScore: number;
    verdict: "HOT" | "WARM" | "COLD";
    aiSummary: string;
    aiAction: string;
    outreachMessage?: string;
    jobsList?: Array<{ title: string; url: string; location: string; salary: string }>;
    newsArticles?: Array<{ title: string; url: string; pubDate: string; source: string }>;
  };
}

export default function CompanyDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "chart" | "jobs" | "news">("ai");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingAlert, setTogglingAlert] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/companies/${id}`);
      setCompany(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load company details:", err);
      setError(err.response?.data?.message || "Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCompanyDetails();

    // Setup socket listener for live updates
    socket.connect();
    const handleSignalUpdate = (data: any) => {
      if (data.companyId === id) {
        setCompany((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            latestSignal: {
              ...prev.latestSignal,
              hireScore: data.hireScore,
              verdict: data.verdict,
              aiSummary: data.aiSummary,
              aiAction: data.aiAction,
              outreachMessage: data.outreachMessage,
              jobsList: data.jobsList,
              newsArticles: data.newsArticles
            }
          };
        });
      }
    };

    socket.on("signal:updated", handleSignalUpdate);

    return () => {
      socket.off("signal:updated", handleSignalUpdate);
    };
  }, [id, isAuthenticated]);

  const handleToggleAlert = async () => {
    if (!company || togglingAlert) return;
    setTogglingAlert(true);
    try {
      const res = await api.patch(`/companies/${company._id}`);
      setCompany((prev) => prev ? { ...prev, alertActive: res.data.alertActive } : null);
    } catch (err) {
      console.error("Failed to toggle alert:", err);
    } finally {
      setTogglingAlert(false);
    }
  };

  const handleDelete = async () => {
    if (!company || deleting) return;
    if (!confirm(`Are you sure you want to remove ${company.companyName} from your watchlist?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/companies/${company._id}`);
      router.push("/dashboard?tab=watchlist");
    } catch (err) {
      console.error("Failed to delete company:", err);
      setDeleting(false);
    }
  };

  const copyToClipboard = () => {
    if (!company?.latestSignal?.outreachMessage) return;
    navigator.clipboard.writeText(company.latestSignal.outreachMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictStyles = (verdict?: string) => {
    switch (verdict) {
      case "HOT":
        return {
          badge: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/25",
          glow: "pulse-glow-red bg-red-500",
          text: "text-red-500"
        };
      case "WARM":
        return {
          badge: "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/25",
          glow: "pulse-glow-orange bg-orange-500",
          text: "text-orange-500"
        };
      case "COLD":
        return {
          badge: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/25",
          glow: "pulse-glow-cyan bg-cyan-500",
          text: "text-blue-500"
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground border-border",
          glow: "bg-muted-foreground",
          text: "text-muted-foreground"
        };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-sm">
          <Activity className="h-10 w-10 mx-auto text-primary mb-4 opacity-75" />
          Please log in to view this company target intelligence workspace.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground mt-2 block animate-pulse font-semibold">Tuning spy signals...</span>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md glass-panel p-8 rounded-2xl space-y-4">
          <ShieldAlert className="h-10 w-10 mx-auto text-rose-500" />
          <h2 className="text-lg font-bold text-foreground">Target Offline</h2>
          <p className="text-xs text-muted-foreground">{error || "The company requested was not found or access is restricted."}</p>
          <Link href="/dashboard?tab=watchlist" className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const styles = getVerdictStyles(company.latestSignal?.verdict);
  const initial = company.companyName.charAt(0).toUpperCase();
  const jobsCount = company.latestSignal?.jobsList?.length || 0;
  const newsCount = company.latestSignal?.newsArticles?.length || 0;

  return (
    <div className="w-full min-h-screen bg-background cyber-grid py-12">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        
        {/* Navigation & Header */}
        <header className="space-y-4">
          <Link 
            href="/dashboard?tab=watchlist" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary/10 to-indigo-500/10 flex items-center justify-center text-primary font-black text-3xl border border-primary/15 shadow-md shadow-primary/5 uppercase">
                {initial}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{company.companyName}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-primary" /> Target: <strong className="text-foreground">{company.targetRole || "Any Role"}</strong>
                  </span>
                  {company.careerUrl && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-border" />
                      <a href={company.careerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary hover:underline">
                        <Globe className="h-3.5 w-3.5" /> Careers URL <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </>
                  )}
                  {company.githubOrg && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-border" />
                      <span className="text-foreground">GitHub Org: <strong>{company.githubOrg}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAlert}
                disabled={togglingAlert}
                className={`gap-1.5 text-xs rounded-xl font-bold ${
                  company.alertActive 
                    ? "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10" 
                    : "hover:bg-muted"
                }`}
              >
                {company.alertActive ? (
                  <>
                    <Bell className="h-4 w-4 shrink-0" />
                    Alerts Active
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Alerts Disabled
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-200/20 text-xs font-bold rounded-xl gap-1.5"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Remove Target
              </Button>
            </div>
          </div>
        </header>

        {/* Top KPI row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KPI 1: Hire Score */}
          <div className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Hiring Chance</p>
              <h3 className="text-3xl font-black tracking-tighter text-foreground mt-2">
                {company.latestSignal?.hireScore !== undefined ? `${company.latestSignal.hireScore}%` : "-"}
              </h3>
              <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium">
                {company.latestSignal?.hireScore !== undefined
                  ? company.latestSignal.hireScore >= 70
                    ? "Highly active hiring signals found"
                    : company.latestSignal.hireScore >= 40
                    ? "Moderate hiring signals found"
                    : "Low hiring activity found"
                  : "Scanning signals..."}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/15 text-primary shadow-inner">
              <Award className="h-6 w-6" />
            </div>
          </div>

          {/* KPI 2: Verdict */}
          <div className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Hiring Temperature</p>
              {company.latestSignal ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-2xl font-black tracking-tighter uppercase ${styles.text}`}>
                    {company.latestSignal.verdict}
                  </span>
                  <span className={`flex h-2.5 w-2.5 rounded-full ${styles.glow}`} />
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-muted-foreground mt-2">N/A</h3>
              )}
              <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium">
                Current Hiring Temperature
              </p>
            </div>
            <div className={`p-3.5 rounded-2xl border bg-muted/40 text-muted-foreground`}>
              <Activity className="h-6 w-6 text-cyan-400" />
            </div>
          </div>

          {/* KPI 3: Scout Signals Count */}
          <div className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm flex items-center justify-between backdrop-blur-md">
            <div>
              <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Scouted Telemetry</p>
              <h3 className="text-2xl font-black tracking-tighter text-foreground mt-2">
                {jobsCount} <span className="text-xs text-muted-foreground font-normal">Jobs</span>
                <span className="mx-2 text-border font-light">|</span>
                {newsCount} <span className="text-xs text-muted-foreground font-normal">News</span>
              </h3>
              <p className="text-[11px] text-muted-foreground/80 mt-1.5 font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Updated in real-time
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 shadow-inner">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>

        </section>

        {/* Tab switcher */}
        <section className="space-y-6">
          <div className="flex border-b border-border/40 gap-2 overflow-x-auto">
            {[
              { id: "ai", name: "AI Scout Intelligence", icon: Sparkles },
              { id: "chart", name: "Hiring Score Analytics", icon: Activity },
              { id: "jobs", name: "Active Job Openings", icon: Briefcase },
              { id: "news", name: "Telemetry News Log", icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3.5 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Pane content */}
          <div className="min-h-[40vh]">
            <AnimatePresence mode="wait">
              {activeTab === "ai" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  <div className="lg:col-span-2 space-y-6">
                    {/* Summary box */}
                    <div className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-md">
                      <h3 className="text-base font-bold text-foreground/90 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-primary" /> AI Intelligence Summary
                      </h3>
                      <div className="text-sm leading-relaxed text-muted-foreground/95 bg-muted/20 p-4 rounded-xl border border-border/25 whitespace-pre-line">
                        {company.latestSignal?.aiSummary || "The AI scouting network is processing and compiling data points. Summary logs will appear shortly."}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    {/* Outreach template generator */}
                    <div className="bg-gradient-to-tr from-primary/[0.02] to-indigo-500/[0.02] border border-primary/25 rounded-2xl p-6 shadow-md space-y-4 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-indigo-500" />
                      
                      <div className="flex justify-between items-center pl-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5" /> AI Outreach Campaign
                        </h3>
                        {company.latestSignal?.outreachMessage && (
                          <button
                            onClick={copyToClipboard}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy template
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="pl-2">
                        {company.latestSignal?.outreachMessage ? (
                          <div className="text-xs text-muted-foreground/90 leading-relaxed max-h-[350px] overflow-y-auto bg-muted/40 p-4 rounded-xl border border-border/30 whitespace-pre-wrap font-mono mt-2">
                            {company.latestSignal.outreachMessage}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic bg-muted/40 p-6 rounded-xl border border-border/30 text-center mt-2">
                            No outreach template generated yet. Telemetry channels are waiting for score spikes to broadcast candidate materials.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "chart" && (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-md"
                >
                  <h3 className="text-base font-bold text-foreground/90 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Historical Target Match index
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                    This chart tracks the target company's hiring score progression over time based on careers site activity updates, public press indexes, and GitHub repo modifications.
                  </p>
                  <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
                    <CompanyChart companyId={company._id} height={350} showAxes={true} />
                  </div>
                </motion.div>
              )}

              {activeTab === "jobs" && (
                <motion.div
                  key="jobs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-md"
                >
                  <h3 className="text-base font-bold text-foreground/90 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" /> Matchmaker Openings ({jobsCount})
                  </h3>
                  
                  {jobsCount === 0 ? (
                    <div className="text-center p-12 bg-muted/20 border border-dashed rounded-xl">
                      <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-semibold">No active job listings match your CV targets.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.latestSignal?.jobsList?.map((job: any, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-foreground leading-snug">{job.title}</h4>
                              <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground font-semibold">
                                <span>Location: {job.location || "N/A"}</span>
                                {job.salary && (
                                  <>
                                    <span className="h-3 w-px bg-border" />
                                    <span>Salary: {job.salary}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {job.match && (
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                                job.match.recommendation === "highly_recommended"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : job.match.recommendation === "good_match"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : job.match.recommendation === "partial_match"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}>
                                {job.match.score}% Match
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Apply opening <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "news" && (
                <motion.div
                  key="news"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card/45 border border-border/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-md"
                >
                  <h3 className="text-base font-bold text-foreground/90 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Scouted Public Updates Timeline ({newsCount})
                  </h3>
                  
                  {newsCount === 0 ? (
                    <div className="text-center p-12 bg-muted/20 border border-dashed rounded-xl">
                      <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-semibold">No recent press reports or public scout events logged.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {company.latestSignal?.newsArticles?.map((art: any, idx) => {
                        const date = art.pubDate ? new Date(art.pubDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }) : "Today";
                        
                        // Default image fallback if imageUrl is not stored on historical records
                        const fallbackImages = [
                          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80",
                          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=80",
                          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80"
                        ];
                        const displayImage = art.imageUrl || fallbackImages[idx % fallbackImages.length];
                        const displayDesc = art.description || `Read the latest market expansions, funding updates, and developer hiring signals for ${company.companyName}.`;
                        
                        return (
                          <div 
                            key={idx} 
                            className="bg-card/30 border border-border/60 hover:border-primary/20 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group"
                          >
                            <div>
                              {/* Card Image */}
                              <div className="h-44 w-full relative overflow-hidden bg-muted/40 border-b border-border/40">
                                <img 
                                  src={displayImage} 
                                  alt={art.title} 
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute top-3 left-3">
                                  <span className="text-[9px] font-bold uppercase text-primary bg-background/95 backdrop-blur-xs border border-primary/20 px-2.5 py-1 rounded-lg shadow-sm">
                                    {art.source || "Google News"}
                                  </span>
                                </div>
                              </div>

                              {/* Card Content */}
                              <div className="p-5 space-y-3">
                                <span className="text-[10px] text-muted-foreground/80 font-semibold block">
                                  {date}
                                </span>
                                <h4 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                  <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {art.title}
                                  </a>
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                  {displayDesc}
                                </p>
                              </div>
                            </div>

                            {/* Card Footer Action */}
                            <div className="p-5 pt-0 mt-2">
                              <a 
                                href={art.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                              >
                                Read Article 
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </div>
    </div>
  );
}
