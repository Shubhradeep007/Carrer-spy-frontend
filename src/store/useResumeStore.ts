import { create } from "zustand";
import api from "@/lib/api";

export interface Resume {
  _id: string;
  isParsed: boolean;
  parseError: string | null;
  fileUrl: string | null;
  fileName?: string;
  isActive?: boolean;
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
  createdAt?: string;
}

interface ResumeState {
  resume: Resume | null;
  resumes: Resume[];
  isLoading: boolean;
  isPolling: boolean;
  uploadResume: (file: File) => Promise<void>;
  fetchResume: () => Promise<void>;
  fetchResumes: () => Promise<void>;
  pollParseStatus: () => void;
  updateResume: (id: string, data: Partial<Resume>) => Promise<void>;
  selectResume: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resume: null,
  resumes: [],
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

  fetchResumes: async () => {
    try {
      const { data } = await api.get("/resume/all");
      set({ resumes: data });
    } catch (error) {
      console.error("Failed to fetch all resumes", error);
      set({ resumes: [] });
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
      await get().fetchResumes(); // Update list
      
      // Start polling
      if (data.isParsed === false) {
        get().pollParseStatus();
      } else {
        await get().fetchResume();
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
          await get().fetchResume(); // Fetch the fully parsed resume or show error
          await get().fetchResumes(); // Update list
        }
      } catch (error) {
        clearInterval(interval);
        set({ isPolling: false });
      }
    }, 5000); // Check every 5 seconds
  },

  updateResume: async (id, updatedData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.put(`/resume/${id}`, updatedData);
      set({ resume: data.resume, isLoading: false });
      await get().fetchResumes(); // Update list
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  selectResume: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.patch(`/resume/${id}/select`);
      await get().fetchResume();
      await get().fetchResumes();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteResume: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.delete(`/resume/${id}`);
      await get().fetchResume();
      await get().fetchResumes();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
