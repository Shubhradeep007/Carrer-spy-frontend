import { create } from "zustand";
import api from "@/lib/api";

export interface Job {
  _id: string;
  title: string;
  company: { name: string; logo?: string };
  location: string;
  type: string;
  description: string;
  jobUrl?: string;
  matchScores?: Array<{ user: string; score: number }>;
  myMatch?: { score: number }; // Injected from backend
  salary?: { min: number; max: number; currency: string };
  postedAt: string;
}

interface JobState {
  jobs: Job[];
  recommendedJobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  searchJobs: (query: string) => Promise<void>;
  fetchRecommendedJobs: () => Promise<void>;
  setSelectedJob: (job: Job | null) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  recommendedJobs: [],
  selectedJob: null,
  isLoading: false,

  searchJobs: async (query) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/jobs/search", { query });
      set({ jobs: data.jobs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRecommendedJobs: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/jobs/recommended");
      set({ recommendedJobs: data.jobs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedJob: (selectedJob) => set({ selectedJob }),
}));
