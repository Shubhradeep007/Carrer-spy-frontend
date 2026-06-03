"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useSpyStore } from "@/store/useSpyStore";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore, Resume } from "@/store/useResumeStore";
import { useUIStore } from "@/store/useUIStore";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CompanyChart } from "@/components/CompanyChart";
import { JobCard } from "@/components/JobCard";
import { JobModal } from "@/components/JobModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, Trash2, Building, Activity, ShieldAlert, Target, Bell, BellOff,
  Briefcase, Sparkles, UploadCloud, CheckCircle, AlertCircle, Save, MapPin,
  GraduationCap, ChevronRight, Award, Search, Star, HelpCircle, FileWarning, FileText, TrendingUp, ArrowRight
} from "lucide-react";

function DashboardContent() {
  const { user, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { openJobModal } = useUIStore();

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

  // Unified Dashboard tab selection
  const [activeTab, setActiveTab] = useState<"watchlist" | "jobs" | "resume">("watchlist");

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Spy Intelligence console</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-3">Career Spy Command Center</h1>
            <p className="text-muted-foreground mt-1 text-sm">Unified system workspace mapping company scout networks and ATS matches.</p>
          </div>
        </div>

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
                  <h2 className="text-lg font-bold flex items-center gap-2 text-foreground/90">
                    <Activity className="h-5 w-5 text-primary animate-pulse" />
                    Target Intelligence Watchlist
                  </h2>

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
                    <div className="grid gap-6">
                      {companies.map((c) => {
                        const styles = getVerdictStyles(c.latestSignal?.verdict);
                        return (
                          <div
                            key={c._id}
                            className="relative group overflow-hidden rounded-2xl glass-panel p-6 shadow-md hover:shadow-xl hover:border-border/40 transition-all duration-300 bg-card/30"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-bold flex items-center gap-2.5">
                                  {c.companyName}
                                  {c.latestSignal && (
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${styles.badge} flex items-center gap-1.5`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${styles.glow}`} />
                                      {c.latestSignal.verdict}
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                                  <Target className="h-3.5 w-3.5 text-primary" /> 
                                  <span>Target:</span> 
                                  <span className="text-foreground/80 font-semibold">{c.targetRole || "Any Role"}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-black tracking-tighter text-foreground">
                                  {c.latestSignal?.hireScore !== undefined ? c.latestSignal.hireScore : "-"}
                                </div>
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-extrabold">Hire Score</p>
                              </div>
                            </div>
                            
                            <div className="mt-5 p-4 rounded-xl bg-muted/40 border border-border/40 text-xs sm:text-sm leading-relaxed">
                              {c.latestSignal ? (
                                <p className="font-medium flex items-start gap-2.5 text-foreground/90">
                                  <ShieldAlert className="h-4.5 w-4.5 mt-0.5 shrink-0 text-primary" />
                                  <span>{c.latestSignal.aiSummary || "Telemetry processing..."}</span>
                                </p>
                              ) : (
                                <p className="font-medium flex items-start gap-2.5 text-muted-foreground animate-pulse">
                                  <Loader2 className="h-4.5 w-4.5 mt-0.5 shrink-0 text-primary animate-spin" />
                                  <span>Scanning targets in real-time...</span>
                                </p>
                              )}
                            </div>

                            <CompanyChart companyId={c._id} />

                            {c.latestSignal && (
                              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/40 pt-5">
                                <div>
                                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    Matching Openings
                                  </h4>
                                  <div className="space-y-2">
                                    {c.latestSignal.jobsList && c.latestSignal.jobsList.length > 0 ? (
                                      c.latestSignal.jobsList.map((job, idx) => (
                                        <a
                                          key={idx}
                                          href={job.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block p-3 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition hover:border-primary/20"
                                        >
                                          <p className="text-xs font-bold text-foreground line-clamp-1 hover:underline">{job.title}</p>
                                          <div className="flex justify-between items-center mt-1.5 text-[9px] text-muted-foreground">
                                            <span>{job.location}</span>
                                            <span className="font-semibold text-foreground/80">{job.salary}</span>
                                          </div>
                                        </a>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic p-2 bg-muted/10 rounded-xl">No active listings matching targets.</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                                    <Activity className="h-4 w-4 text-cyan-400" />
                                    Signals & Public Updates
                                  </h4>
                                  <div className="space-y-2">
                                    {c.latestSignal.newsArticles && c.latestSignal.newsArticles.length > 0 ? (
                                      c.latestSignal.newsArticles.map((art, idx) => {
                                        const pubDate = art.pubDate ? new Date(art.pubDate).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric'
                                        }) : "Today";
                                        return (
                                          <a
                                            key={idx}
                                            href={art.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-3 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition hover:border-primary/20"
                                          >
                                            <p className="text-xs font-bold text-foreground line-clamp-1 hover:underline">{art.title}</p>
                                            <div className="flex justify-between items-center mt-1.5 text-[9px] text-muted-foreground">
                                              <span>{art.source}</span>
                                              <span>{pubDate}</span>
                                            </div>
                                          </a>
                                        );
                                      })
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic p-2 bg-muted/10 rounded-xl">No recent press updates captured.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="absolute top-4 right-4 flex gap-1.5">
                              <button
                                onClick={() => toggleAlert(c._id)}
                                className={`p-2 opacity-0 group-hover:opacity-100 transition-all rounded-full border shadow-sm ${
                                  c.alertActive
                                    ? "text-primary bg-primary/10 border-primary/20"
                                    : "text-muted-foreground bg-background border-border hover:text-primary"
                                }`}
                                title={c.alertActive ? "Disable notifications" : "Enable notifications"}
                              >
                                {c.alertActive ? <Bell className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}
                              </button>
                              <button
                                onClick={() => deleteCompany(c._id)}
                                className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-background rounded-full border border-border hover:border-red-200 shadow-sm"
                                title="Remove tracker"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
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
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">Target Role</label>
                        <Input 
                          placeholder="e.g. Frontend Engineer" 
                          value={newCompany.targetRole}
                          onChange={(e) => setNewCompany({...newCompany, targetRole: e.target.value})}
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">Careers Page URL</label>
                        <Input 
                          placeholder="https://careers.google.com" 
                          value={newCompany.careerUrl}
                          onChange={(e) => setNewCompany({...newCompany, careerUrl: e.target.value})}
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-muted-foreground">GitHub Organization</label>
                        <Input 
                          placeholder="e.g. google" 
                          value={newCompany.githubOrg}
                          onChange={(e) => setNewCompany({...newCompany, githubOrg: e.target.value})}
                          className="bg-background/40"
                        />
                      </div>
                      <Button type="submit" className="w-full mt-3 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5" disabled={!newCompany.companyName || isSpyLoading}>
                        {isSpyLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Start Spying</>}
                      </Button>
                    </form>
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
                        Specify details inside the **ATS Resume Core** tab to let Gemini scan vacancies matching your credentials.
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
                      <h3 className="font-bold text-foreground text-sm">Gemini AI Parser Running</h3>
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
                          <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-extrabold text-muted-foreground">{resumes.length} / 10</span>
                        </div>
                        
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

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                          {resumes.map((r) => {
                            const isSelected = selectedResume?._id === r._id;
                            const uploadDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Unknown";
                            return (
                              <div
                                key={r._id}
                                onClick={() => setSelectedResume(r)}
                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center gap-3 relative ${
                                  isSelected ? "border-primary bg-primary/[0.02] shadow-sm shadow-primary/5" : "border-border hover:border-border/60 bg-background/40"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText className={`h-8 w-8 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/75"}`} />
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
                              {selectedResume.isActive ? (
                                <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/25 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider h-9">
                                  <CheckCircle className="h-4 w-4 shrink-0" /> Active Profile
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!selectedResume.isParsed}
                                  onClick={() => selectResume(selectedResume._id)}
                                  className="rounded-xl flex items-center gap-1.5 h-9 text-xs font-bold"
                                >
                                  Make Active
                                </Button>
                              )}
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
                                  <Icon className="h-4 w-4 shrink-0" />
                                  {tab.name}
                                </button>
                              );
                            })}
                          </div>

                          <div className="min-h-[30vh]">
                            {activeResumeTab === "overview" && (
                              <div className="space-y-4">
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
                              </div>
                            )}

                            {activeResumeTab === "skills" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              </div>
                            )}

                            {activeResumeTab === "experience" && (
                              <div className="space-y-4">
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
                              </div>
                            )}

                            {activeResumeTab === "education" && (
                              <div className="space-y-4">
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
                              </div>
                            )}
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
