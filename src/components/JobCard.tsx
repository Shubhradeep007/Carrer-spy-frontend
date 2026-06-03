"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2, MapPin, DollarSign, Star } from "lucide-react";
import { Job } from "@/store/useJobStore";

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
  };

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(99, 102, 241, 0.3)" }}
      onClick={onClick}
      className="group cursor-pointer rounded-2xl glass-panel p-5 transition-all shadow-sm hover:shadow-lg bg-card/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/30 shadow-inner shrink-0">
            {job.company.logo ? (
              <img src={job.company.logo} alt={job.company.name} className="h-8 w-8 object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{job.company.name}</p>
          </div>
        </div>
        {job.myMatch && (
          <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase shrink-0 ${getScoreColor(job.myMatch.score)}`}>
            <Star className="h-3 w-3 fill-current" />
            <span>{job.myMatch.score}% Match</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 border border-border/30 px-2.5 py-1">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {job.location}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 border border-border/30 px-2.5 py-1">
          <Briefcase className="h-3.5 w-3.5 text-primary" />
          {job.type}
        </div>
        {job.salary && (
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 border border-border/30 px-2.5 py-1 font-semibold text-foreground/80">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            {job.salary.min / 1000}k - {job.salary.max / 1000}k {job.salary.currency}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {job.description}
      </p>
    </motion.div>
  );
}

