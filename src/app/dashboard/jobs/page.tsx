"use client";

import { useEffect, useState } from "react";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useUIStore } from "@/store/useUIStore";
import { JobCard } from "@/components/JobCard";
import { JobModal } from "@/components/JobModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Search, Sparkles, Building, Loader2, ArrowRight,
  TrendingUp, Star, HelpCircle, FileWarning
} from "lucide-react";
import Link from "next/link";

export default function JobsPage() {
  const { jobs, recommendedJobs, isLoading, searchJobs, fetchRecommendedJobs, setSelectedJob } = useJobStore();
  const { resume, fetchResume } = useResumeStore();
  const { openJobModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchResume();
    fetchRecommendedJobs();
  }, [fetchResume, fetchRecommendedJobs]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    await searchJobs(searchQuery);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            AI-Matched Job Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Search active openings or let Gemini recommend matched roles based on your ATS profile.
          </p>
        </div>

        {/* ATS Resume Upload callout banner if not uploaded yet */}
        {!resume && (
          <Link href="/dashboard/resume">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.03] text-yellow-600 hover:text-yellow-700 transition cursor-pointer"
            >
              <FileWarning className="h-5 w-5 shrink-0" />
              <div className="text-left text-xs">
                <p className="font-bold">Missing ATS Resume Details</p>
                <p className="opacity-80 mt-0.5">Upload a CV to calculate real-time AI Match Scores.</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-1" />
            </motion.div>
          </Link>
        )}
      </div>

      {/* Modern Search Wrapper */}
      <form onSubmit={handleSearchSubmit} className="mb-12 max-w-2xl">
        <div className="flex gap-2 p-1.5 rounded-2xl border border-border bg-card shadow-sm focus-within:ring-1 focus-within:ring-foreground transition-all">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="e.g. Node developer in Bangalore, Frontend Engineer..."
              className="w-full bg-transparent border-0 text-sm focus:outline-none placeholder:text-muted-foreground h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading || !searchQuery.trim()} className="flex items-center gap-1.5 h-9 px-4 rounded-xl">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>
      </form>

      {/* Main Grid: Query Search Listings vs Recommended list */}
      <div className="space-y-12">
        {/* Search Results Column */}
        {hasSearched && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Search Results
            </h2>

            {isLoading && jobs.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 4, 6].map((i) => (
                  <div key={i} className="h-[180px] rounded-xl border border-border bg-muted/20 animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-12 border border-dashed rounded-xl bg-muted/10">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold">No jobs matching your query</h3>
                <p className="text-sm text-muted-foreground mt-1">Try broad keywords, e.g. "React developer" or "Java".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onClick={() => {
                      setSelectedJob(job);
                      openJobModal();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended Jobs Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Personalized AI Recommendations
            </h2>
            {resume && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                Matched to: {resume.desiredRoles?.[0] || resume.currentJobTitle || "Your CV Profile"}
              </span>
            )}
          </div>

          {!resume ? (
            /* Upload CV reminder card */
            <div className="text-center p-12 border border-dashed rounded-3xl bg-muted/10">
              <Star className="h-12 w-12 mx-auto text-yellow-500 mb-4 opacity-50 animate-pulse" />
              <h3 className="text-lg font-bold">Unlock AI Recommendations</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Upload your resume, and our system will use Gemini AI to suggest matching job openings, score your compatibility, and identify skill gaps!
              </p>
              <Link href="/dashboard/resume" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/10">
                Go to Resume Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : isLoading && recommendedJobs.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-[180px] rounded-xl border border-border bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-xl bg-muted/10">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-bold">No recommendations found yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure your CV profile lists target roles and locations so we can fetch positions!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onClick={() => {
                    setSelectedJob(job);
                    openJobModal();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render the details model at the bottom of the page */}
      <JobModal />
    </div>
  );
}
