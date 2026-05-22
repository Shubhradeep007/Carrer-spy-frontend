"use client";

import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Briefcase, Building2, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useJobStore } from "@/store/useJobStore";

export function JobModal() {
  const { isJobModalOpen, closeJobModal } = useUIStore();
  const { selectedJob } = useJobStore();

  if (!selectedJob) return null;

  return (
    <Modal
      isOpen={isJobModalOpen}
      onClose={closeJobModal}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-muted">
            {selectedJob.company.logo ? (
              <img src={selectedJob.company.logo} alt={selectedJob.company.name} className="h-10 w-10 object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
            <p className="text-lg text-muted-foreground">{selectedJob.company.name}</p>
          </div>
        </div>
        {selectedJob.myMatch && (
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-muted-foreground">AI Match</span>
            <span className="text-2xl font-black text-foreground">{selectedJob.myMatch.score}%</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-md">
          <MapPin className="h-4 w-4" />
          {selectedJob.location}
        </div>
        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-md">
          <Briefcase className="h-4 w-4" />
          {selectedJob.type}
        </div>
        {selectedJob.salary && (
          <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-md">
            <DollarSign className="h-4 w-4" />
            {selectedJob.salary.min / 1000}k - {selectedJob.salary.max / 1000}k {selectedJob.salary.currency}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Job Description</h3>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {selectedJob.description}
          </div>
        </div>

        {/* If we have full AI match data (matched skills, missing skills) we would show them here */}
      </div>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md pt-6 mt-6 border-t border-border flex justify-end gap-3">
        <Button variant="outline" onClick={closeJobModal}>Close</Button>
        <Button className="flex items-center gap-2">
          Apply Now <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Modal>
  );
}
