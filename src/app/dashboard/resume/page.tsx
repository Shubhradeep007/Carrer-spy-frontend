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
  const { resume, isLoading, isPolling, fetchResume, uploadResume, updateResume } = useResumeStore();
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "experience" | "education">("overview");
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
  }, [fetchResume]);

  useEffect(() => {
    if (resume) {
      setFormData(resume);
    }
  }, [resume]);

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
    setSaveStatus("saving");
    try {
      await updateResume(formData);
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

  if (isLoading && !resume) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading resume profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Resume Workspace
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload your CV to let Gemini extract your skills, parse details, and match you with target roles.
          </p>
        </div>

        {resume && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="shadow-lg shadow-primary/10 flex items-center gap-2"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Profile"}
            </Button>
          </div>
        )}
      </div>

      {isPolling && (
        <div className="mb-8 p-6 rounded-2xl border border-primary/20 bg-primary/[0.02] flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-foreground">AI CV Parsing in progress...</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gemini is currently analyzing your resume structure, classifying skills, and normalizing employment histories. This takes roughly 5 to 10 seconds.
            </p>
          </div>
        </div>
      )}

      {resume?.parseError && (
        <div className="mb-8 p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.02] flex items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-red-500">Resume extraction failed</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Reason: {resume.parseError}. You can re-upload your resume or manually complete the details below.
            </p>
          </div>
        </div>
      )}

      {!resume ? (
        /* Drag and Drop Resume Uploader */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/[0.02] scale-[1.01]"
                : "border-border hover:border-foreground/30 bg-muted/20"
            }`}
          >
            <UploadCloud className="h-16 w-16 mx-auto text-muted-foreground opacity-70 mb-4" />
            <h3 className="text-xl font-bold">Upload your Resume</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Drag & drop your file here, or click to browse. Supports PDF and Word documents (.pdf, .docx).
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
              className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold cursor-pointer transition shadow-sm"
            >
              Choose File
            </label>

            {file && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-xl border bg-background/50 flex items-center justify-between max-w-md mx-auto"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleUploadSubmit} className="flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4" /> Parse CV
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        /* Workspace Form View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Tabs */}
          <aside className="lg:col-span-1 space-y-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-3">Sections</h3>
            {[
              { id: "overview", name: "Overview", icon: FileText },
              { id: "skills", name: "Skills Matrix", icon: Award },
              { id: "experience", name: "Work History", icon: Briefcase },
              { id: "education", name: "Education", icon: GraduationCap }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold border transition ${
                    activeTab === tab.id
                      ? "text-primary bg-primary/[0.04] border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.name}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-55" />
                </button>
              );
            })}

            {/* Quick Actions */}
            <div className="pt-6 border-t border-border mt-6">
              <label htmlFor="re-upload" className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-dashed border-border hover:border-foreground/30 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer bg-background transition">
                <UploadCloud className="h-4 w-4" />
                Re-upload Resume
              </label>
              <input
                type="file"
                id="re-upload"
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
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                This will overwrite your existing parsed details.
              </p>
            </div>
          </aside>

          {/* Form Content Area */}
          <main className="lg:col-span-3 border rounded-2xl bg-card p-6 shadow-sm min-h-[50vh]">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold">Profile Overview</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Basic ATS parameters and desired goals.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Professional Summary</label>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
                        placeholder="Write a brief professional summary..."
                        value={formData.summary || ""}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Current Job Title</label>
                        <Input
                          placeholder="e.g. Senior Frontend Engineer"
                          value={formData.currentJobTitle || ""}
                          onChange={(e) => setFormData({ ...formData, currentJobTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Current Location</label>
                        <Input
                          placeholder="e.g. Bangalore, India"
                          value={formData.currentLocation || ""}
                          onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Total Experience (Years)</label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 5"
                          value={formData.totalExperienceYears !== undefined ? formData.totalExperienceYears : ""}
                          onChange={(e) => setFormData({ ...formData, totalExperienceYears: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Desired Roles (Comma-separated)</label>
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
                      <label className="text-sm font-semibold mb-1.5 block">Preferred Locations (Comma-separated)</label>
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold">Technical Skills Matrix</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Skills grouped by category for Gemini ATS calculations.</p>
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
                        <label className="text-sm font-semibold mb-1.5 block capitalize">{cat.name}</label>
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold">Employment History</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Track your previous work experiences and achievements.</p>
                  </div>

                  {/* Existing experiences list */}
                  <div className="space-y-4">
                    {(formData.experience || []).map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-xl border bg-muted/30 relative flex justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold">{exp.title}</h4>
                          <p className="text-sm font-semibold text-primary">{exp.company} {exp.location && `• ${exp.location}`}</p>
                          <p className="text-xs text-muted-foreground">{exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}</p>
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
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Experience form */}
                  <div className="pt-6 border-t border-border mt-6 space-y-4">
                    <h3 className="font-bold text-sm">Add New Experience</h3>
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
                        placeholder="Write a brief overview of responsibilities and achievements..."
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold">Education Details</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your degrees, certifications, and academic details.</p>
                  </div>

                  {/* Existing education list */}
                  <div className="space-y-4">
                    {(formData.education || []).map((edu, idx) => (
                      <div key={idx} className="p-4 rounded-xl border bg-muted/30 relative flex justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold">{edu.degree || "Degree/Certification"}</h4>
                          <p className="text-sm font-semibold text-primary">{edu.institution} {edu.location && `• ${edu.location}`}</p>
                          <p className="text-xs text-muted-foreground">{edu.startDate} – {edu.endDate} {edu.grade && `• Grade: ${edu.grade}`}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-muted-foreground hover:text-red-500 self-start p-1.5 border hover:bg-background rounded-lg transition"
                          title="Remove education"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Education form */}
                  <div className="pt-6 border-t border-border mt-6 space-y-4">
                    <h3 className="font-bold text-sm">Add Academic Record</h3>
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
                        <label className="text-xs font-semibold mb-1 block">Start Date</label>
                        <Input
                          placeholder="e.g. 2017"
                          value={newEdu.startDate}
                          onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">End Date (Graduation)</label>
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
          </main>
        </div>
      )}
    </div>
  );
}
