import { create } from "zustand";
import api from "@/lib/api";

export interface Resume {
  _id: string;
  isParsed: boolean;
  parseError: string | null;
  fileUrl: string | null;
  summary: string;
  currentJobTitle: string;
  currentLocation: string;
  totalExperienceYears: number;
  skills: {
    frontend: string[];
    backend: string[];
    dbms: string[];
    os: string[];
    devops: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  experience: any[];
  education: any[];
  preferredLocations: string[];
  desiredRoles: string[];
}

interface ResumeState {
  resume: Resume | null;
  isLoading: boolean;
  isPolling: boolean;
  uploadResume: (file: File) => Promise<void>;
  fetchResume: () => Promise<void>;
  pollParseStatus: () => void;
  updateResume: (data: Partial<Resume>) => Promise<void>;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resume: null,
  isLoading: false,
  isPolling: false,

  fetchResume: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/resume");
      set({ resume: data, isLoading: false });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Failed to fetch resume", error);
      }
      set({ resume: null, isLoading: false });
    }
  },

  uploadResume: async (file: File) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      formData.append("resume", file);
      
      const { data } = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      set({ isLoading: false });
      
      // Start polling
      if (data.isParsed === false) {
        get().pollParseStatus();
      } else {
        get().fetchResume();
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  pollParseStatus: () => {
    if (get().isPolling) return;
    set({ isPolling: true });

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get("/resume/status");
        if (data.isParsed || data.parseError) {
          clearInterval(interval);
          set({ isPolling: false });
          get().fetchResume(); // Fetch the fully parsed resume or show error
        }
      } catch (error) {
        clearInterval(interval);
        set({ isPolling: false });
      }
    }, 5000); // Check every 5 seconds
  },

  updateResume: async (updatedData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.put("/resume", updatedData);
      set({ resume: data.resume, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
