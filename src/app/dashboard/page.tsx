"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useSpyStore } from "@/store/useSpyStore";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore, Resume } from "@/store/useResumeStore";
import { useUIStore } from "@/store/useUIStore";
import { socket } from "@/lib/socket";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CompanyChart } from "@/components/CompanyChart";
import { JobCard } from "@/components/JobCard";
import { JobModal } from "@/components/JobModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, Trash2, Building, Activity, ShieldAlert, Target, Bell, BellOff,
  Briefcase, Sparkles, UploadCloud, CheckCircle, AlertCircle, Save, MapPin,
  GraduationCap, ChevronRight, Award, Search, Star, HelpCircle, FileWarning, FileText, TrendingUp, ArrowRight,
  Megaphone, X
} from "lucide-react";

function DashboardContent() {
  const { user, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { openJobModal } = useUIStore();

  // Subscription Details
  const sub = user?.subscriptionStatus || "free";
  const companyLimits = { free: 1, basic: 3, pro: 10 };
  const resumeLimits = { free: 1, basic: 2, pro: Infinity };
  const maxCompanies = companyLimits[sub as keyof typeof companyLimits] || 1;
  const maxResumes = resumeLimits[sub as keyof typeof resumeLimits] || 1;
  const maxResumesLabel = maxResumes === Infinity ? "∞" : maxResumes.toString();

  // Watchlist Store
  const {
    companies,
    isLoading: isSpyLoading,
    fetchCompanies,
    addCompany,
    deleteCompany,
    toggleAlert,
    updateSignalRealtime
  } = useSpyStore();

  // Jobs Store
  const {
    jobs,
    recommendedJobs,
    isLoading: isJobsLoading,
    searchJobs,
    fetchRecommendedJobs,
    setSelectedJob
  } = useJobStore();

  // Resume Store
  const {
    resume,
    resumes,
    isLoading: isResumeLoading,
    isPolling,
    fetchResume,
    fetchResumes,
    uploadResume,
    updateResume,
    selectResume,
    deleteResume
  } = useResumeStore();

  // Over-limit flags — computed after stores are available
  const isOverCompanyLimit = companies.length > maxCompanies;
  const excessCompanyCount = Math.max(0, companies.length - maxCompanies);
  const isOverResumeLimit = maxResumes !== Infinity && resumes.length > maxResumes;
  const excessResumeCount = Math.max(0, resumes.length - (maxResumes === Infinity ? 0 : maxResumes));

  // Unified Dashboard tab selection
  const [activeTab, setActiveTab] = useState<"watchlist" | "jobs" | "resume">("watchlist");

  // Notices state
  const [notices, setNotices] = useState<any[]>([]);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);

  // Local Watchlist Form state
  const [newCompany, setNewCompany] = useState({ companyName: "", targetRole: "", careerUrl: "", githubOrg: "" });

  // Local Job Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Local Resume Hub States
  const [activeResumeTab, setActiveResumeTab] = useState<"overview" | "skills" | "experience" | "education">("overview");
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<Resume>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [newExp, setNewExp] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: ""
  });

  const [newEdu, setNewEdu] = useState({
    degree: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    grade: ""
  });

  // Sync tab param from URL
  useEffect(() => {
    if (tabParam === "watchlist" || tabParam === "jobs" || tabParam === "resume") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Initial Fetching
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
      fetchResume();
      fetchResumes();
      fetchRecommendedJobs();

      // Load dismissed notices from localStorage
      const dismissed = JSON.parse(localStorage.getItem("dismissed_notices") || "[]");
      setDismissedNoticeIds(dismissed);

      // Fetch active system notices
      const fetchNotices = async () => {
        try {
          const res = await api.get("/notices");
          setNotices(res.data || []);
        } catch (err) {
          console.error("Failed to fetch user notices:", err);
        }
      };
      fetchNotices();

      // Socket Room Join
      socket.connect();
      socket.emit("join_room", { userId: user?._id });

      socket.on("signal:updated", (data) => {
        updateSignalRealtime(data.companyId, {
          hireScore: data.hireScore,
          verdict: data.verdict,
          aiSummary: data.aiSummary,
          aiAction: data.aiAction,
          jobsList: data.jobsList,
          newsArticles: data.newsArticles
        });
      });

      return () => {
        socket.off("signal:updated");
      };
    }
  }, [isAuthenticated, user, fetchCompanies, fetchResume, fetchResumes, fetchRecommendedJobs, updateSignalRealtime]);

  // Sync Resume States
  useEffect(() => {
    if (resumes.length > 0) {
      if (selectedResume) {
        const updated = resumes.find(r => r._id === selectedResume._id);
        if (updated) {
          setSelectedResume(updated);
          return;
        }
      }
      const active = resumes.find(r => r.isActive);
      setSelectedResume(active || resumes[0]);
    } else {
      setSelectedResume(null);
    }
  }, [resumes, resume]);

  useEffect(() => {
    if (selectedResume) {
      setFormData(selectedResume);
    } else {
      setFormData({});
    }
  }, [selectedResume]);

  // Handlers for Watchlist
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.companyName) return;
    if (companies.length >= maxCompanies) {
      alert(`Limit reached. Upgrade your workspace to add more companies.`);
      return;
    }
    await addCompany(newCompany);
    setNewCompany({ companyName: "", targetRole: "", careerUrl: "", githubOrg: "" });
  };

  const getVerdictStyles = (verdict?: string) => {
    switch (verdict) {
      case "HOT":
        return {
          badge: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/25",
          glow: "pulse-glow-red bg-red-500"
        };
      case "WARM":
        return {
          badge: "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/25",
          glow: "pulse-glow-orange bg-orange-500"
        };
      case "COLD":
        return {
          badge: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/25",
          glow: "pulse-glow-cyan bg-cyan-500"
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground border-border",
          glow: "bg-muted-foreground"
        };
    }
  };

  // Handlers for Jobs Search
  const handleJobsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    await searchJobs(searchQuery);
  };

  // Handlers for Resume Hub
  const handleResumeDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (resumes.length >= maxResumes) {
      alert(`Limit reached. Upgrade your subscription plan to upload more resume profiles.`);
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf" || ext === "docx" || ext === "doc") {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF or Word document (.docx/.doc)");
      }
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (resumes.length >= maxResumes) {
      alert(`Limit reached. Upgrade your subscription plan to upload more resume profiles.`);
      return;
    }
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleResumeUpload = async () => {
    if (!file) return;
    try {
      await uploadResume(file);
      setFile(null);
    } catch (err: any) {
      alert(err.message || "Failed to upload resume");
    }
  };

  const handleResumeSave = async () => {
    if (!selectedResume) return;
    setSaveStatus("saving");
    try {
      await updateResume(selectedResume._id, formData);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleAddExperience = () => {
    if (!newExp.title || !newExp.company) return;
    const currentExp = formData.experience || [];
    const updatedExp = [...currentExp, { ...newExp }];
    setFormData({ ...formData, experience: updatedExp });
    setNewExp({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: ""
    });
  };

  const handleRemoveExperience = (index: number) => {
    const currentExp = formData.experience || [];
    const updatedExp = currentExp.filter((_, idx) => idx !== index);
    setFormData({ ...formData, experience: updatedExp });
  };

  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.institution) return;
    const currentEdu = formData.education || [];
    const updatedEdu = [...currentEdu, { ...newEdu }];
    setFormData({ ...formData, education: updatedEdu });
    setNewEdu({
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      grade: ""
    });
  };

  const handleRemoveEducation = (index: number) => {
    const currentEdu = formData.education || [];
    const updatedEdu = currentEdu.filter((_, idx) => idx !== index);
    setFormData({ ...formData, education: updatedEdu });
  };

  const handleSkillChange = (category: string, value: string) => {
    const skillsList = value.split(",").map((s) => s.trim()).filter(Boolean);
    setFormData({
      ...formData,
      skills: {
        ...(formData.skills || {
          frontend: [], backend: [], dbms: [], os: [], devops: [], soft: [], languages: [], tools: []
        }),
        [category]: skillsList
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 text-muted-foreground bg-background min-h-[70vh]">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-sm">
          <Activity className="h-10 w-10 mx-auto text-primary mb-4 opacity-75" />
          Please log in to view your Command Center.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background cyber-grid py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Command Center Title Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-border/40 pb-6">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Spy Intelligence console</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-3">Career Spy Command Center</h1>
            <p className="text-muted-foreground mt-1 text-sm">Unified system workspace mapping company scout networks and ATS matches.</p>
          </div>

          {/* User Active Plan Information Header Widget */}
          <div className="flex items-center gap-4 bg-card/45 backdrop-blur-md border border-border/80 p-4 rounded-2xl shadow-sm w-full lg:w-auto justify-between lg:justify-start">
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Active Workspace Tier</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                  sub === "pro" 
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse" 
                    : sub === "basic"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {sub} Plan
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-border/40 hidden lg:block" />
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/95 hover:to-indigo-500/95 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5 uppercase tracking-wider"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Manage Plan
            </Link>
          </div>
        </div>

        {/* Active System Notices Banner */}
        <AnimatePresence>
          {notices
            .filter((n) => !dismissedNoticeIds.includes(n._id))
            .map((notice) => (
              <motion.div
                key={notice._id}
                initial={{ opacity: 0, y: -15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.03] to-indigo-500/[0.03] backdrop-blur-md p-5 relative shadow-md"
              >
                {/* Visual side bar line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-indigo-500" />
                
                <div className="flex justify-between items-start gap-4 pl-2">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0 shadow-inner">
                      <Megaphone className="h-5 w-5 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                        {notice.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/90 mt-1.5 whitespace-pre-line leading-relaxed">
                        {notice.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-muted-foreground font-semibold">
                        <span>By {notice.createdBy?.name || "System Admin"}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/45" />
                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updatedDismissed = [...dismissedNoticeIds, notice._id];
                      setDismissedNoticeIds(updatedDismissed);
                      localStorage.setItem("dismissed_notices", JSON.stringify(updatedDismissed));
                    }}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition shrink-0"
                    title="Dismiss"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Unified Tab Switcher Navigation */}
        <div className="flex border-b border-border/40 mb-8 gap-2 overflow-x-auto">
          {[
            { id: "watchlist", name: "Company Tracker", icon: Activity },
            { id: "jobs", name: "Job Matchmaker", icon: Briefcase },
            { id: "resume", name: "ATS Resume Core", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", tab.id);
                  window.history.pushState({}, "", url.toString());
                }}
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

        {/* CENTRAL PANE ROUTING */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: Company Tracker Watchlist */}
            {activeTab === "watchlist" && (
              <motion.div
                key="watchlist"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Watchlist Cards list */}
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-lg font-bold flex items-center justify-between gap-2 text-foreground/90 w-full">
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary animate-pulse" />
                      Target Intelligence Watchlist
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isOverCompanyLimit
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {companies.length} / {maxCompanies} tracked
                    </span>
                  </h2>

                  {/* Over-limit banner for companies */}
                  {isOverCompanyLimit && (
                    <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-xs leading-relaxed flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <span className="font-extrabold block uppercase tracking-wide text-[10px] text-red-400 mb-1">
                            Plan Limit Exceeded — Action Required
                          </span>
                          <p className="text-red-400/90">
                            Your current <span className="font-bold uppercase">{sub}</span> plan allows tracking <span className="font-bold">{maxCompanies}</span> {maxCompanies === 1 ? "company" : "companies"}, but you have <span className="font-bold">{companies.length}</span> tracked. The <span className="font-bold">{excessCompanyCount}</span> excess {excessCompanyCount === 1 ? "company" : "companies"} (highlighted in red below) will not receive new intelligence updates. Please remove them or upgrade your plan.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/dashboard/billing"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors uppercase tracking-wider"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Upgrade Plan
                        </Link>
                        <span className="text-red-400/70 text-[10px] flex items-center">or remove the highlighted companies below using the delete button.</span>
                      </div>
                    </div>
                  )}

                  {isSpyLoading && companies.length === 0 ? (
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : companies.length === 0 ? (
                    <div className="text-center p-16 rounded-2xl glass-panel bg-muted/10 border-dashed">
                      <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                      <h3 className="text-lg font-bold">No active company targets</h3>
                      <p className="text-muted-foreground text-sm mt-1">Add target corporations in the sidebar scanner panel.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {companies.map((c, index) => {
                        const styles = getVerdictStyles(c.latestSignal?.verdict);
                        const initial = c.companyName.charAt(0).toUpperCase();
                        const jobsCount = c.latestSignal?.jobsList?.length || 0;
                        const newsCount = c.latestSignal?.newsArticles?.length || 0;
                        const isExcess = index >= maxCompanies;

                        return (
                          <div
                            key={c._id}
                            className={`relative overflow-hidden rounded-2xl border backdrop-blur-md p-6 shadow-sm transition-all duration-300 flex flex-col justify-between ${
                              isExcess
                                ? "border-red-500/40 bg-red-500/[0.03] opacity-75"
                                : "border-border/80 bg-card/60 hover:shadow-md hover:border-primary/30"
                            }`}
                          >
                            {/* Excess lock overlay badge */}
                            {isExcess && (
                              <div className="absolute top-3 right-3 z-10">
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full">
                                  <ShieldAlert className="h-3 w-3" /> Exceeds Plan
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-3">
                                  {/* Visual Icon Badge */}
                                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-primary/10 to-indigo-500/10 flex items-center justify-center text-primary font-black text-lg border border-primary/15 shadow-inner shrink-0 uppercase">
                                    {initial}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-base text-foreground leading-tight">{c.companyName}</h3>
                                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                      <Target className="h-3 w-3 text-primary" />
                                      <span>{c.targetRole || "Any Role"}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  {c.latestSignal ? (
                                    <div className="flex flex-col items-end">
                                      <div className="text-2xl font-black tracking-tighter text-foreground">
                                        {c.latestSignal.hireScore}%
                                      </div>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${styles.badge} mt-0.5`}>
                                        {c.latestSignal.verdict}
                                      </span>
                                      <span className="text-[8px] text-muted-foreground/80 uppercase font-bold tracking-wider mt-1">
                                        Hiring Chance
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic animate-pulse">Scanning...</span>
                                  )}
                                </div>
                              </div>

                              {/* Small AI summary excerpt */}
                              <p className="text-xs text-muted-foreground/90 mt-4 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/20">
                                {c.latestSignal?.aiSummary || "Scouting network initializing telemetry channels..."}
                              </p>
                            </div>

                            {/* Info Badges & Action Button */}
                            <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 gap-4">
                              <div className="flex gap-2 text-[10px] font-bold text-muted-foreground">
                                <span className="px-2 py-1 bg-muted/40 rounded-lg border border-border/40">
                                  {jobsCount} {jobsCount === 1 ? 'Job' : 'Jobs'}
                                </span>
                                <span className="px-2 py-1 bg-muted/40 rounded-lg border border-border/40">
                                  {newsCount} {newsCount === 1 ? 'Update' : 'Updates'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => toggleAlert(c._id)}
                                  className={`p-2 rounded-xl border transition-all ${
                                    c.alertActive
                                      ? "text-primary bg-primary/10 border-primary/20"
                                      : "text-muted-foreground bg-background border-border/80 hover:text-primary hover:bg-muted/30"
                                  }`}
                                  title={c.alertActive ? "Disable notifications" : "Enable notifications"}
                                >
                                  {c.alertActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => deleteCompany(c._id)}
                                  className="p-2 text-muted-foreground hover:text-rose-500 bg-background border border-border/80 hover:border-rose-200 rounded-xl transition-all"
                                  title="Remove tracker"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <Link
                                  href={`/dashboard/companies/${c._id}`}
                                  className="ml-1.5 inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
                                >
                                  Console
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sidebar target manager */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 rounded-2xl glass-panel p-6 shadow-md border-border/30 bg-card/40">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      Add Target Company
                    </h2>
                    
                    <form onSubmit={handleAddCompany} className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">Company Name *</label>
                        <Input 
                          placeholder="e.g. Google, Stripe" 
                          value={newCompany.companyName}
                          onChange={(e) => setNewCompany({...newCompany, companyName: e.target.value})}
                          required
                          disabled={companies.length >= maxCompanies}
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">Target Role</label>
                        <Input 
                          placeholder="e.g. Frontend Engineer" 
                          value={newCompany.targetRole}
                          onChange={(e) => setNewCompany({...newCompany, targetRole: e.target.value})}
                          disabled={companies.length >= maxCompanies}
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">Careers Page URL</label>
                        <Input 
                          placeholder="https://careers.google.com" 
                          value={newCompany.careerUrl}
                          onChange={(e) => setNewCompany({...newCompany, careerUrl: e.target.value})}
                          disabled={companies.length >= maxCompanies}
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">GitHub Organization</label>
                        <Input 
                          placeholder="e.g. google" 
                          value={newCompany.githubOrg}
                          onChange={(e) => setNewCompany({...newCompany, githubOrg: e.target.value})}
                          disabled={companies.length >= maxCompanies}
                          className="bg-background/40"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-3 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5" 
                        disabled={!newCompany.companyName || isSpyLoading || companies.length >= maxCompanies}
                      >
                        {isSpyLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Start Spying</>}
                      </Button>
                    </form>

                    {/* Exceeded Limits Warning Message inside Scanner form */}
                    {companies.length >= maxCompanies && (
                      <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-500/90 leading-relaxed flex flex-col gap-2.5 mt-4">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-yellow-500 mt-0.5" />
                          <div>
                            <span className="font-extrabold block uppercase tracking-wide text-[10px] text-yellow-400 mb-0.5">
                              Watchlist Limit Reached ({companies.length} / {maxCompanies})
                            </span>
                            You have reached the maximum companies allowed on your {sub.toUpperCase()} plan. Upgrade to unlock more slots!
                          </div>
                        </div>
                        <Link 
                          href="/dashboard/billing"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded-lg transition-colors w-full uppercase tracking-wider mt-1 text-center"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Upgrade Workspace
                        </Link>
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Job Matchmaker */}
            {activeTab === "jobs" && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/90">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI-Matched Job Board
                    </h2>
                    <p className="text-muted-foreground text-xs mt-1">Review personalized vacancy indexing matched to your active CV credentials.</p>
                  </div>

                  {!resume && (
                    <button
                      onClick={() => setActiveTab("resume")}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.03] text-yellow-600 hover:text-yellow-700 transition text-left glass-panel"
                    >
                      <FileWarning className="h-5 w-5 shrink-0 text-yellow-500 animate-pulse" />
                      <div className="text-xs">
                        <p className="font-bold">Missing ATS Resume Profile</p>
                        <p className="opacity-80 mt-0.5">Click here to upload CV and calculate match scores.</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>

                {/* Search Panel */}
                <form onSubmit={handleJobsSearch} className="max-w-2xl mb-8">
                  <div className="flex gap-2 p-1.5 rounded-2xl border border-border/85 bg-card/60 backdrop-blur-md shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all">
                    <div className="flex-1 flex items-center gap-2 px-3">
                      <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        placeholder="e.g. React developer in SF, Node engineer..."
                        className="w-full bg-transparent border-0 text-sm focus:outline-none placeholder:text-muted-foreground h-9 text-foreground"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={isJobsLoading || !searchQuery.trim()} className="flex items-center gap-1.5 h-9 px-5 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white">
                      {isJobsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Search
                    </Button>
                  </div>
                </form>

                {/* Search Results list */}
                {hasSearched && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2 text-foreground/80">
                      <TrendingUp className="h-4.5 w-4.5 text-primary" />
                      Query Listings
                    </h3>
                    {isJobsLoading && jobs.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-[180px] rounded-2xl border border-border/40 bg-muted/10 animate-pulse glass-panel" />
                        ))}
                      </div>
                    ) : jobs.length === 0 ? (
                      <div className="text-center p-12 rounded-2xl glass-panel bg-muted/10 border-dashed">
                        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                        <h4 className="font-bold">No results found</h4>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {jobs.map((job) => (
                          <JobCard key={job._id} job={job} onClick={() => { setSelectedJob(job); openJobModal(); }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommended Matches */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold flex items-center gap-2 text-foreground/80">
                      <Sparkles className="h-4.5 w-4.5 text-primary" />
                      Personalized AI Recommendations
                    </h3>
                    {resume && (
                      <span className="text-[9px] font-extrabold px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary uppercase tracking-wide">
                        Matched to: {resume.desiredRoles?.[0] || resume.currentJobTitle || "CV Profile"}
                      </span>
                    )}
                  </div>

                  {!resume ? (
                    <div className="text-center p-12 rounded-3xl glass-panel bg-card/30">
                      <Star className="h-12 w-12 mx-auto text-yellow-500 mb-4 opacity-50 animate-pulse" />
                      <h3 className="text-lg font-bold">Unlock AI Recommendations</h3>
                      <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                        Specify details inside the **ATS Resume Core** tab to let Career Spy AI scan vacancies matching your credentials.
                      </p>
                    </div>
                  ) : isJobsLoading && recommendedJobs.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-[180px] rounded-2xl border border-border/40 bg-muted/10 animate-pulse glass-panel" />
                      ))}
                    </div>
                  ) : recommendedJobs.length === 0 ? (
                    <div className="text-center p-12 rounded-2xl glass-panel bg-muted/10 border-dashed">
                      <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                      <h3 className="text-sm font-bold">No active matches found</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendedJobs.map((job) => (
                        <JobCard key={job._id} job={job} onClick={() => { setSelectedJob(job); openJobModal(); }} />
                      ))}
                    </div>
                  )}
                </div>
                <JobModal />
              </motion.div>
            )}

            {/* TAB 3: ATS Resume Core */}
            {activeTab === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Polling loader */}
                {isPolling && (
                  <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.03] flex items-start gap-4 animate-pulse glass-panel">
                    <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Career Spy AI Parser Running</h3>
                      <p className="text-xs text-muted-foreground mt-1">AI is actively structuring CV fields...</p>
                    </div>
                  </div>
                )}

                {resumes.length === 0 ? (
                  /* Empty state drop zone */
                  <div
                    onDragEnter={handleResumeDrag}
                    onDragLeave={handleResumeDrag}
                    onDragOver={handleResumeDrag}
                    onDrop={handleResumeDrop}
                    className="border-2 border-dashed rounded-3xl p-16 text-center transition-all glass-panel border-border bg-card/30"
                  >
                    <div className="bg-primary/5 rounded-full p-5 w-fit mx-auto mb-6 border border-primary/10 shadow-inner">
                      <UploadCloud className="h-14 w-14 text-primary opacity-80" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">Upload your ATS Resume</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2.5">
                      Drag & drop your file here, or click to browse. Supported formats: PDF, DOCX, or DOC.
                    </p>
                    <input
                      type="file"
                      id="resume-upload"
                      className="hidden"
                      accept=".pdf,.docx,.doc"
                      onChange={handleResumeFileChange}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold cursor-pointer transition shadow-sm hover:border-foreground/20 hover:-translate-y-0.5"
                    >
                      Choose File
                    </label>

                    {file && (
                      <div className="mt-8 p-4 rounded-2xl border bg-background/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md mx-auto">
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-primary shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={handleResumeUpload} className="w-full sm:w-auto flex items-center gap-2 bg-primary hover:bg-primary/95 text-white rounded-lg">
                          <UploadCloud className="h-4 w-4" /> Parse CV
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Side-by-side workspace */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left side selector */}
                    <aside className="lg:col-span-4 space-y-6">
                      <div className="rounded-2xl glass-panel p-5 shadow-sm bg-card/40">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Documents</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            isOverResumeLimit
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}>{resumes.length} / {maxResumesLabel}</span>
                        </div>

                        {/* Over-limit banner for resumes (downgrade scenario) */}
                        {isOverResumeLimit && (
                          <div className="p-3.5 rounded-xl border border-red-500/25 bg-red-500/5 text-xs leading-relaxed flex flex-col gap-2.5 mb-4">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                              <div>
                                <span className="font-extrabold block uppercase tracking-wide text-[9px] text-red-400 mb-0.5">
                                  Resume Limit Exceeded — Action Required
                                </span>
                                <p className="text-red-400/90">
                                  Your <span className="font-bold uppercase">{sub}</span> plan allows <span className="font-bold">{maxResumes}</span> {maxResumes === 1 ? "resume" : "resumes"}, but you have <span className="font-bold">{resumes.length}</span>. The <span className="font-bold">{excessResumeCount}</span> excess {excessResumeCount === 1 ? "resume" : "resumes"} (marked in red) will not be scanned. Remove them or upgrade.
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/dashboard/billing"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors uppercase tracking-wider"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Upgrade Plan
                            </Link>
                          </div>
                        )}
                        
                        {/* Only show upload button if they haven't reached plan limits */}
                        {resumes.length < maxResumes ? (
                          <div className="mb-4">
                            <input
                              type="file"
                              id="sidebar-upload"
                              className="hidden"
                              accept=".pdf,.docx,.doc"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  try {
                                    await uploadResume(e.target.files[0]);
                                  } catch (err: any) {
                                    alert(err.message || "Failed to upload resume");
                                  }
                                }
                              }}
                            />
                            <label
                              htmlFor="sidebar-upload"
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer bg-background/50 hover:bg-primary/[0.01] transition-all shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                              Upload New Resume
                            </label>
                          </div>
                        ) : (
                          /* Exceeded limits warning banner for resumes */
                          <div className="p-3.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-500/90 leading-relaxed flex flex-col gap-2 mb-4">
                            <div className="flex items-start gap-2">
                              <ShieldAlert className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
                              <div>
                                <span className="font-extrabold block uppercase tracking-wide text-[9px] text-yellow-400 mb-0.5">
                                  Upload Limit Reached ({resumes.length} / {maxResumesLabel})
                                </span>
                                Your {sub.toUpperCase()} plan allows up to {maxResumes} active resumes.
                              </div>
                            </div>
                            <Link 
                              href="/dashboard/billing"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-bold rounded-lg transition-colors w-full uppercase tracking-wider text-center"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Upgrade Plan
                            </Link>
                          </div>
                        )}

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                          {resumes.map((r, index) => {
                            const isSelected = selectedResume?._id === r._id;
                            const uploadDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Unknown";
                            const isExcessResume = maxResumes !== Infinity && index >= maxResumes;
                            return (
                              <div
                                key={r._id}
                                onClick={() => {
                                  if (!isExcessResume) setSelectedResume(r);
                                }}
                                className={`p-3.5 rounded-xl border transition-all flex justify-between items-center gap-3 relative ${
                                  isExcessResume
                                    ? "border-red-500/30 bg-red-500/[0.03] cursor-not-allowed"
                                    : isSelected
                                    ? "border-primary bg-primary/[0.02] shadow-sm shadow-primary/5 cursor-pointer"
                                    : "border-border hover:border-border/60 bg-background/40 cursor-pointer"
                                }`}
                              >
                                {isExcessResume && (
                                  <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                                    <ShieldAlert className="h-2.5 w-2.5" /> Over Limit
                                  </span>
                                )}
                                <div className={`flex items-center gap-3 min-w-0 ${isExcessResume ? "opacity-50" : ""}`}>
                                  <FileText className={`h-8 w-8 shrink-0 ${isExcessResume ? "text-red-400/60" : isSelected ? "text-primary" : "text-muted-foreground/75"}`} />
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold truncate pr-1">{r.fileName || "Resume.pdf"}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-muted-foreground">{uploadDate}</span>
                                      {r.isActive && <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-green-500/10">Active</span>}
                                      {!r.isParsed && !r.parseError && <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded animate-pulse">Parsing</span>}
                                      {r.parseError && <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">Error</span>}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (confirm("Delete this CV?")) deleteResume(r._id); }}
                                  className="text-muted-foreground hover:text-red-500 p-1.5 hover:bg-muted rounded-lg transition shrink-0 opacity-70 hover:opacity-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </aside>

                    {/* Right side editor */}
                    <main className="lg:col-span-8">
                      {selectedResume ? (
                        <div className="rounded-2xl glass-panel p-6 shadow-sm bg-card/40">
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-border mb-6 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-muted rounded-xl">
                                <FileText className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm sm:text-base">{selectedResume.fileName}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Status: {selectedResume.isParsed ? <span className="text-green-500 font-semibold">Parsed</span> : <span className="text-red-500 font-semibold">Failed</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {selectedResume.fileUrl && (
                                <a
                                  href={selectedResume.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold h-9 shadow-sm"
                                >
                                  View Original
                                </a>
                              )}
                              <Button
                                size="sm"
                                onClick={handleResumeSave}
                                disabled={saveStatus === "saving" || !selectedResume.isParsed}
                                className={`rounded-xl flex items-center gap-1.5 h-9 text-xs font-bold transition-all ${
                                  saveStatus === "saved"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : saveStatus === "error"
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-primary hover:bg-primary/95 text-white"
                                }`}
                              >
                                {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {saveStatus === "saved" && <CheckCircle className="h-3.5 w-3.5 animate-pulse" />}
                                {saveStatus === "error" && <AlertCircle className="h-3.5 w-3.5" />}
                                {saveStatus === "idle" && <Save className="h-3.5 w-3.5" />}
                                {saveStatus === "saving" && "Saving..."}
                                {saveStatus === "saved" && "Saved!"}
                                {saveStatus === "error" && "Error - Retry"}
                                {saveStatus === "idle" && "Save Profile"}
                              </Button>
                              {(() => {
                                const selectedIndex = resumes.findIndex(r => r._id === selectedResume._id);
                                const isSelectedExcess = maxResumes !== Infinity && selectedIndex >= maxResumes;
                                if (isSelectedExcess) {
                                  return (
                                    <Link
                                      href="/dashboard/billing"
                                      className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/25 px-4 py-1.5 rounded-xl text-xs font-bold h-9 hover:bg-red-500/20 transition-colors"
                                    >
                                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> Upgrade to Activate
                                    </Link>
                                  );
                                }
                                if (selectedResume.isActive) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/25 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider h-9">
                                      <CheckCircle className="h-4 w-4 shrink-0" /> Active Profile
                                    </span>
                                  );
                                }
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!selectedResume.isParsed}
                                    onClick={() => selectResume(selectedResume._id)}
                                    className="rounded-xl flex items-center gap-1.5 h-9 text-xs font-bold"
                                  >
                                    Make Active
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Horizontal Tab Bar inside CV workspace */}
                          <div className="flex border-b border-border mb-6 overflow-x-auto gap-2">
                            {[
                              { id: "overview", name: "Overview", icon: FileText },
                              { id: "skills", name: "Skills Matrix", icon: Award },
                              { id: "experience", name: "Work History", icon: Briefcase },
                              { id: "education", name: "Education", icon: GraduationCap }
                            ].map((tab) => {
                              const Icon = tab.icon;
                              const isActive = activeResumeTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveResumeTab(tab.id as any)}
                                  className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Icon className="h-4.5 w-4.5 shrink-0" />
                                  {tab.name}
                                </button>
                              );
                            })}
                          </div>

                          <div className="min-h-[30vh]">
                            <AnimatePresence mode="wait">
                              {activeResumeTab === "overview" && (
                                <motion.div
                                  key="overview"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-4"
                                >
                                  <div>
                                    <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-muted-foreground">Professional Summary</label>
                                    <textarea
                                      className="flex min-h-[100px] w-full rounded-xl border border-border bg-background/30 px-3 py-2 text-xs shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary"
                                      value={formData.summary || ""}
                                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-muted-foreground">Current Title</label>
                                      <Input
                                        value={formData.currentJobTitle || ""}
                                        onChange={(e) => setFormData({ ...formData, currentJobTitle: e.target.value })}
                                        className="bg-background/30 rounded-xl"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-muted-foreground">Location</label>
                                      <Input
                                        value={formData.currentLocation || ""}
                                        onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                                        className="bg-background/30 rounded-xl"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-muted-foreground">Total Experience (Years)</label>
                                      <Input
                                        type="number"
                                        step="0.5"
                                        value={formData.totalExperienceYears !== undefined ? formData.totalExperienceYears : ""}
                                        onChange={(e) => setFormData({ ...formData, totalExperienceYears: Number(e.target.value) || 0 })}
                                        className="bg-background/30 rounded-xl"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold uppercase tracking-wider mb-1 block text-muted-foreground">Desired Roles</label>
                                      <Input
                                        value={(formData.desiredRoles || []).join(", ")}
                                        onChange={(e) => setFormData({
                                          ...formData,
                                          desiredRoles: e.target.value.split(",").map((r) => r.trim()).filter(Boolean)
                                        })}
                                        className="bg-background/30 rounded-xl"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {activeResumeTab === "skills" && (
                                <motion.div
                                  key="skills"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                  {[
                                    { id: "frontend", name: "Frontend Technologies" },
                                    { id: "backend", name: "Backend & Systems" },
                                    { id: "dbms", name: "Databases (DBMS)" },
                                    { id: "devops", name: "Cloud & DevOps" },
                                    { id: "tools", name: "Tools & Utilities" },
                                    { id: "soft", name: "Soft Capabilities" }
                                  ].map((cat) => (
                                    <div key={cat.id} className="p-4 rounded-2xl bg-muted/10 border border-border/30">
                                      <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block text-primary">{cat.name}</label>
                                      <Input
                                        value={(formData.skills?.[cat.id as keyof typeof formData.skills] || []).join(", ")}
                                        onChange={(e) => handleSkillChange(cat.id, e.target.value)}
                                        className="bg-background/30 rounded-xl mb-2"
                                      />
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {(formData.skills?.[cat.id as keyof typeof formData.skills] || []).map((skill, idx) => (
                                          <span key={idx} className="bg-primary/5 text-primary border border-primary/10 text-[8px] font-extrabold px-2 py-0.5 rounded">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}

                              {activeResumeTab === "experience" && (
                                <motion.div
                                  key="experience"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-4"
                                >
                                  <div className="space-y-3">
                                    {(formData.experience || []).map((exp, idx) => (
                                      <div key={idx} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex justify-between gap-4 text-xs">
                                        <div>
                                          <h5 className="font-bold">{exp.title}</h5>
                                          <p className="font-semibold text-primary">{exp.company} • {exp.location}</p>
                                          <p className="text-muted-foreground">{exp.startDate} – {exp.endDate}</p>
                                          {exp.description && <p className="text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>}
                                        </div>
                                        <button onClick={() => handleRemoveExperience(idx)} className="text-muted-foreground hover:text-red-500 self-start p-1 hover:bg-background rounded-lg border border-border/20">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="pt-4 border-t border-border space-y-4">
                                    <h5 className="font-bold text-xs">Add Experience</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      <Input placeholder="Role Title" value={newExp.title} onChange={(e) => setNewExp({...newExp, title: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="Company" value={newExp.company} onChange={(e) => setNewExp({...newExp, company: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                      <Input placeholder="Location" value={newExp.location} onChange={(e) => setNewExp({...newExp, location: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="Start Date" value={newExp.startDate} onChange={(e) => setNewExp({...newExp, startDate: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="End Date" value={newExp.endDate} disabled={newExp.isCurrent} onChange={(e) => setNewExp({...newExp, endDate: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" id="isCurrent" checked={newExp.isCurrent} onChange={(e) => setNewExp({...newExp, isCurrent: e.target.checked, endDate: e.target.checked ? "Present" : ""})} />
                                      <label htmlFor="isCurrent" className="text-xs text-muted-foreground">I currently work here</label>
                                    </div>
                                    <textarea placeholder="Description" value={newExp.description} onChange={(e) => setNewExp({...newExp, description: e.target.value})} className="w-full rounded-xl border border-border bg-background/30 p-2.5 text-xs min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary" />
                                    <Button size="sm" onClick={handleAddExperience} disabled={!newExp.title || !newExp.company} className="h-8 text-xs bg-primary hover:bg-primary/95 text-white">Add Entry</Button>
                                  </div>
                                </motion.div>
                              )}

                              {activeResumeTab === "education" && (
                                <motion.div
                                  key="education"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-4"
                                >
                                  <div className="space-y-3">
                                    {(formData.education || []).map((edu, idx) => (
                                      <div key={idx} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex justify-between gap-4 text-xs">
                                        <div>
                                          <h5 className="font-bold">{edu.degree}</h5>
                                          <p className="font-semibold text-primary">{edu.institution} • {edu.location}</p>
                                          <p className="text-muted-foreground">{edu.startDate} – {edu.endDate} {edu.grade && `• Grade: ${edu.grade}`}</p>
                                        </div>
                                        <button onClick={() => handleRemoveEducation(idx)} className="text-muted-foreground hover:text-red-500 self-start p-1 hover:bg-background rounded-lg border border-border/20">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="pt-4 border-t border-border space-y-4">
                                    <h5 className="font-bold text-xs">Add Academic Entry</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      <Input placeholder="Degree" value={newEdu.degree} onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="Institution" value={newEdu.institution} onChange={(e) => setNewEdu({...newEdu, institution: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                      <Input placeholder="Location" value={newEdu.location} onChange={(e) => setNewEdu({...newEdu, location: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="Start Date" value={newEdu.startDate} onChange={(e) => setNewEdu({...newEdu, startDate: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="End Date" value={newEdu.endDate} onChange={(e) => setNewEdu({...newEdu, endDate: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                      <Input placeholder="GPA / Grade" value={newEdu.grade} onChange={(e) => setNewEdu({...newEdu, grade: e.target.value})} className="bg-background/30 rounded-xl text-xs h-8" />
                                    </div>
                                    <Button size="sm" onClick={handleAddEducation} disabled={!newEdu.degree || !newEdu.institution} className="h-8 text-xs bg-primary hover:bg-primary/95 text-white">Add Entry</Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-6 glass-panel rounded-2xl bg-card/40">
                          <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                          <p className="text-sm font-semibold">No profile loaded</p>
                          <p className="text-xs text-muted-foreground mt-1">Upload a CV on the sidebar selector.</p>
                        </div>
                      )}
                    </main>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-8 bg-background min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
