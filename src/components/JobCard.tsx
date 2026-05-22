"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2, MapPin, DollarSign } from "lucide-react";
import { Job } from "@/store/useJobStore";

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-background p-5 transition-all hover:border-foreground/20 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted">
            {job.company.logo ? (
              <img src={job.company.logo} alt={job.company.name} className="h-8 w-8 object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-none group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{job.company.name}</p>
          </div>
        </div>
        {job.myMatch && (
          <div className="flex items-center justify-center rounded-full bg-foreground text-background px-3 py-1 text-xs font-bold">
            {job.myMatch.score}% Match
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
          <Briefcase className="h-3.5 w-3.5" />
          {job.type}
        </div>
        {job.salary && (
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
            <DollarSign className="h-3.5 w-3.5" />
            {job.salary.min / 1000}k - {job.salary.max / 1000}k {job.salary.currency}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
        {job.description}
      </p>
    </motion.div>
  );
}
