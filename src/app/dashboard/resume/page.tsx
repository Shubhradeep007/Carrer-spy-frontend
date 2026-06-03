"use client";

import { useEffect, useState } from "react";
import { useResumeStore, Resume } from "@/store/useResumeStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, UploadCloud, CheckCircle, AlertCircle, Loader2, Save,
  Plus, Trash2, MapPin, Briefcase, GraduationCap, ChevronRight, Award
} from "lucide-react";

export default function ResumePage() {
  const {
    resume,
    resumes,
    isLoading,
    isPolling,
    fetchResume,
    fetchResumes,
    uploadResume,
    updateResume,
    selectResume,
    deleteResume
  } = useResumeStore();
  
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "experience" | "education">("overview");
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Local form state
  const [formData, setFormData] = useState<Partial<Resume>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Local add experience form state
  const [newExp, setNewExp] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: ""
  });

  // Local add education form state
  const [newEdu, setNewEdu] = useState({
    degree: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    grade: ""
  });

  useEffect(() => {
    fetchResume();
    fetchResumes();
  }, [fetchResume, fetchResumes]);

  // Sync selected resume
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

  // Sync form details
  useEffect(() => {
    if (selectedResume) {
      setFormData(selectedResume);
    } else {
      setFormData({});
    }
  }, [selectedResume]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    try {
      await uploadResume(file);
      setFile(null);
    } catch (err: any) {
      alert(err.message || "Failed to upload resume");
    }
  };

  const handleSave = async () => {
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

  if (isLoading && resumes.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading resume profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 mb-8 border border-indigo-900/40 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              ATS Workspace
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 flex items-center gap-3">
              <FileText className="h-9 w-9 text-indigo-400" />
              Resume Intelligence Hub
            </h1>
            <p className="text-indigo-200/70 mt-2 text-sm sm:text-base max-w-xl">
              Upload multiple CVs, switch profiles seamlessly, and select your active CV to feed the AI job matching engine.
            </p>
          </div>
          
          {resumes.length > 0 && selectedResume && (
            <div className="shrink-0 flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saveStatus === "saving" || !selectedResume.isParsed}
                className="bg-white text-slate-950 hover:bg-slate-100 font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-white/5 border border-white/20"
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveStatus === "saving" ? "Saving Changes..." : saveStatus === "saved" ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isPolling && (
        <div className="mb-8 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] flex items-center gap-4 animate-pulse">
          <Loader2 className="h-7 w-7 animate-spin text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-foreground text-sm sm:text-base">AI Resume Parsing in progress...</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gemini is currently analyzing your resume structure, extracting skills, and indexing experience. This takes roughly 5 to 8 seconds.
            </p>
          </div>
        </div>
      )}

      {resumes.length === 0 ? (
        /* Drag and Drop Resume Uploader (Empty State) */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto my-12"
        >
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/[0.02] scale-[1.01]"
                : "border-border hover:border-foreground/30 bg-muted/20"
            }`}
          >
            <div className="bg-primary/5 rounded-full p-5 w-fit mx-auto mb-6">
              <UploadCloud className="h-14 w-14 text-primary opacity-80" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Upload your first Resume</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2.5">
              Drag & drop your file here, or click to browse. We support PDF and Word formats (.pdf, .docx).
            </p>
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
            />
            <label
              htmlFor="resume-upload"
              className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold cursor-pointer transition shadow-sm"
            >
              Choose File
            </label>

            {file && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-4 rounded-2xl border bg-background flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md mx-auto"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleUploadSubmit} className="w-full sm:w-auto flex items-center gap-2">
                  <UploadCloud className="h-4 w-4" /> Parse CV
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        /* Side-by-Side Premium Document Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: Document Selector */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="border border-border rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Your Documents</h3>
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold text-muted-foreground">{resumes.length} / 10</span>
              </div>
              
              {/* Quick Upload Button */}
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
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer bg-background hover:bg-primary/[0.01] transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Upload New Resume
                </label>
              </div>

              {/* Scrollable list of resumes */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {resumes.map((r) => {
                  const isSelected = selectedResume?._id === r._id;
                  const uploadDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  }) : "Unknown";

                  return (
                    <div
                      key={r._id}
                      onClick={() => setSelectedResume(r)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex justify-between items-center gap-3 relative ${
                        isSelected
                          ? "border-primary bg-primary/[0.02] shadow-sm shadow-primary/5"
                          : "border-border hover:border-foreground/15 bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className={`h-8 w-8 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/70"}`} />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate pr-1">{r.fileName || "Resume.pdf"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{uploadDate}</span>
                            {r.isActive && (
                              <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                                Active
                              </span>
                            )}
                            {!r.isParsed && !r.parseError && (
                              <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider animate-pulse">
                                Parsing
                              </span>
                            )}
                            {r.parseError && (
                              <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                                Error
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete option */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this resume?")) {
                            deleteResume(r._id);
                          }
                        }}
                        className="text-muted-foreground hover:text-red-500 p-1.5 hover:bg-muted rounded-lg transition shrink-0 opacity-70 hover:opacity-100"
                        title="Delete Resume"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Quick stats / Tip Card */}
            {resume && (
              <div className="border border-indigo-900/10 bg-indigo-500/[0.01] rounded-2xl p-5 text-xs text-muted-foreground leading-relaxed">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5 text-indigo-400">
                  <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                  Active CV Selected
                </h4>
                Currently matching jobs using: <span className="font-semibold text-foreground truncate block mt-1">{resume.fileName}</span>
              </div>
            )}
          </aside>

          {/* RIGHT CONTENT PANEL: Active Editor & Details */}
          <main className="lg:col-span-8 space-y-6">
            {selectedResume ? (
              <div className="border border-border rounded-2xl bg-card p-6 shadow-sm">
                
                {/* Selected Resume Header Details */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-border mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-xl text-foreground">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg">{selectedResume.fileName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Status:{" "}
                        {selectedResume.isParsed ? (
                          <span className="text-green-500 font-semibold">Parsed successfully</span>
                        ) : selectedResume.parseError ? (
                          <span className="text-red-500 font-semibold">Parsing failed</span>
                        ) : (
                          <span className="text-yellow-500 font-semibold animate-pulse">AI Extraction running...</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Active Toggle Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    {selectedResume.fileUrl && (
                      <a
                        href={selectedResume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition text-muted-foreground hover:text-foreground h-9 shadow-sm"
                        title="Download / Open Original CV"
                      >
                        View Original
                      </a>
                    )}
                    {selectedResume.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/25 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider h-9 shadow-sm">
                        <CheckCircle className="h-4 w-4 shrink-0" /> Selected for Matching
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!selectedResume.isParsed}
                        onClick={() => selectResume(selectedResume._id)}
                        className="rounded-xl flex items-center gap-1.5 shadow-sm text-xs font-bold h-9"
                      >
                        Make Active
                      </Button>
                    )}
                  </div>
                </div>

                {/* Show error explanation if parsing failed */}
                {selectedResume.parseError && (
                  <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.02] flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-500">AI Parsing Error</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedResume.parseError}. You can edit the parameters manually using the tabs below or re-upload a clean file.
                      </p>
                    </div>
                  </div>
                )}

                {/* Horizontal Modern Tab Bar */}
                <div className="flex border-b border-border mb-6 overflow-x-auto gap-2">
                  {[
                    { id: "overview", name: "Overview", icon: FileText },
                    { id: "skills", name: "Skills Matrix", icon: Award },
                    { id: "experience", name: "Work History", icon: Briefcase },
                    { id: "education", name: "Education", icon: GraduationCap }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                          isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {tab.name}
                      </button>
                    );
                  })}
                </div>

                {/* Document details container */}
                <div className="min-h-[40vh]">
                  <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div>
                          <h4 className="font-bold text-foreground text-sm sm:text-base">Profile Summary</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Summary of the CV used for context during interview matches.</p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold mb-1.5 block">Professional Summary</label>
                            <textarea
                              className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
                              placeholder="Write a brief professional summary..."
                              value={formData.summary || ""}
                              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold mb-1.5 block">Current Job Title</label>
                              <Input
                                placeholder="e.g. Senior Frontend Engineer"
                                value={formData.currentJobTitle || ""}
                                onChange={(e) => setFormData({ ...formData, currentJobTitle: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1.5 block">Current Location</label>
                              <Input
                                placeholder="e.g. Bangalore, India"
                                value={formData.currentLocation || ""}
                                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold mb-1.5 block">Total Experience (Years)</label>
                              <Input
                                type="number"
                                step="0.5"
                                placeholder="e.g. 5"
                                value={formData.totalExperienceYears !== undefined ? formData.totalExperienceYears : ""}
                                onChange={(e) => setFormData({ ...formData, totalExperienceYears: Number(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1.5 block">Desired Roles (Comma-separated)</label>
                              <Input
                                placeholder="e.g. React Lead, Fullstack Engineer"
                                value={(formData.desiredRoles || []).join(", ")}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  desiredRoles: e.target.value.split(",").map((r) => r.trim()).filter(Boolean)
                                })}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold mb-1.5 block">Preferred Locations (Comma-separated)</label>
                            <Input
                              placeholder="e.g. Bangalore, Pune, Remote"
                              value={(formData.preferredLocations || []).join(", ")}
                              onChange={(e) => setFormData({
                                ...formData,
                                preferredLocations: e.target.value.split(",").map((l) => l.trim()).filter(Boolean)
                              })}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "skills" && (
                      <motion.div
                        key="skills"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div>
                          <h4 className="font-bold text-foreground text-sm sm:text-base">Technical Skills Matrix</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Skills grouped by category for Gemini ATS calculations.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { id: "frontend", name: "Frontend Skills" },
                            { id: "backend", name: "Backend Skills" },
                            { id: "dbms", name: "Databases (DBMS)" },
                            { id: "devops", name: "DevOps & Cloud" },
                            { id: "os", name: "Operating Systems" },
                            { id: "tools", name: "Development Tools" },
                            { id: "soft", name: "Soft Skills" },
                            { id: "languages", name: "Human Languages" }
                          ].map((cat) => (
                            <div key={cat.id}>
                              <label className="text-xs font-semibold mb-1.5 block capitalize">{cat.name}</label>
                              <Input
                                placeholder="Comma-separated skills..."
                                value={(formData.skills?.[cat.id as keyof typeof formData.skills] || []).join(", ")}
                                onChange={(e) => handleSkillChange(cat.id, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "experience" && (
                      <motion.div
                        key="experience"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div>
                          <h4 className="font-bold text-foreground text-sm sm:text-base">Employment History</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Track previous work experiences and achievements.</p>
                        </div>

                        <div className="space-y-4">
                          {(formData.experience || []).map((exp, idx) => (
                            <div key={idx} className="p-4 rounded-xl border bg-muted/20 relative flex justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="font-bold text-sm">{exp.title}</h5>
                                <p className="text-xs font-semibold text-primary">{exp.company} {exp.location && `• ${exp.location}`}</p>
                                <p className="text-[11px] text-muted-foreground">{exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}</p>
                                {exp.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed mt-2 whitespace-pre-wrap">
                                    {exp.description}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveExperience(idx)}
                                className="text-muted-foreground hover:text-red-500 self-start p-1.5 border hover:bg-background rounded-lg transition"
                                title="Remove experience"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="pt-6 border-t border-border mt-6 space-y-4">
                          <h5 className="font-bold text-sm">Add New Experience</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Title *</label>
                              <Input
                                placeholder="e.g. Senior Developer"
                                value={newExp.title}
                                onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Company *</label>
                              <Input
                                placeholder="e.g. Google"
                                value={newExp.company}
                                onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Location</label>
                              <Input
                                placeholder="e.g. Bangalore"
                                value={newExp.location}
                                onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Start Date</label>
                              <Input
                                placeholder="e.g. Jun 2021"
                                value={newExp.startDate}
                                onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">End Date</label>
                              <Input
                                placeholder="e.g. Present"
                                value={newExp.endDate}
                                disabled={newExp.isCurrent}
                                onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isCurrent"
                              checked={newExp.isCurrent}
                              onChange={(e) => setNewExp({
                                ...newExp,
                                isCurrent: e.target.checked,
                                endDate: e.target.checked ? "Present" : ""
                              })}
                            />
                            <label htmlFor="isCurrent" className="text-xs font-semibold">I currently work here</label>
                          </div>

                          <div>
                            <label className="text-xs font-semibold mb-1 block">Description</label>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
                              placeholder="Responsibilities and accomplishments..."
                              value={newExp.description}
                              onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                            />
                          </div>

                          <Button
                            size="sm"
                            onClick={handleAddExperience}
                            disabled={!newExp.title || !newExp.company}
                            className="flex items-center gap-1.5"
                          >
                            <Plus className="h-4 w-4" /> Add to History
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "education" && (
                      <motion.div
                        key="education"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div>
                          <h4 className="font-bold text-foreground text-sm sm:text-base">Education Details</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Manage degrees, certifications, and academic history.</p>
                        </div>

                        <div className="space-y-4">
                          {(formData.education || []).map((edu, idx) => (
                            <div key={idx} className="p-4 rounded-xl border bg-muted/20 relative flex justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="font-bold text-sm">{edu.degree || "Degree/Certification"}</h5>
                                <p className="text-xs font-semibold text-primary">{edu.institution} {edu.location && `• ${edu.location}`}</p>
                                <p className="text-[11px] text-muted-foreground">{edu.startDate} – {edu.endDate} {edu.grade && `• Grade: ${edu.grade}`}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveEducation(idx)}
                                className="text-muted-foreground hover:text-red-500 self-start p-1.5 border hover:bg-background rounded-lg transition"
                                title="Remove education"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="pt-6 border-t border-border mt-6 space-y-4">
                          <h5 className="font-bold text-sm">Add Academic Record</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Degree / Certification *</label>
                              <Input
                                placeholder="e.g. B.Tech Computer Science"
                                value={newEdu.degree}
                                onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Institution *</label>
                              <Input
                                placeholder="e.g. Stanford University"
                                value={newEdu.institution}
                                onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Location</label>
                              <Input
                                placeholder="e.g. Stanford, CA"
                                value={newEdu.location}
                                onChange={(e) => setNewEdu({ ...newEdu, location: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Start Year</label>
                              <Input
                                placeholder="e.g. 2017"
                                value={newEdu.startDate}
                                onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">End Year</label>
                              <Input
                                placeholder="e.g. 2021"
                                value={newEdu.endDate}
                                onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold mb-1 block">Grade / Score</label>
                              <Input
                                placeholder="e.g. 8.5 CGPA"
                                value={newEdu.grade}
                                onChange={(e) => setNewEdu({ ...newEdu, grade: e.target.value })}
                              />
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={handleAddEducation}
                            disabled={!newEdu.degree || !newEdu.institution}
                            className="flex items-center gap-1.5"
                          >
                            <Plus className="h-4 w-4" /> Add Record
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-2xl bg-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
                <FileText className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-lg font-bold">No Resume Selected</h3>
                <p className="text-sm max-w-sm mt-1">Select a document from the left list to view details or edit its fields.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
