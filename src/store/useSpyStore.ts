import { create } from "zustand";
import api from "@/lib/api";

export interface WatchedCompany {
  _id: string;
  companyName: string;
  careerUrl: string;
  githubOrg: string;
  targetRole: string;
  alertActive: boolean;
  latestSignal?: {
    hireScore: number;
    verdict: "HOT" | "WARM" | "COLD";
    aiSummary: string;
    aiAction: string;
    jobsList?: Array<{ title: string; url: string; location: string; salary: string }>;
    newsArticles?: Array<{ title: string; url: string; pubDate: string; source: string }>;
  };
}

interface SpyState {
  companies: WatchedCompany[];
  isLoading: boolean;
  fetchCompanies: () => Promise<void>;
  addCompany: (companyData: any) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  updateSignalRealtime: (companyId: string, signalData: any) => void;
}

export const useSpyStore = create<SpyState>((set) => ({
  companies: [],
  isLoading: false,

  fetchCompanies: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/companies");
      set({ companies: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch companies", error);
      set({ isLoading: false });
    }
  },

  addCompany: async (companyData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/companies", companyData);
      set((state) => ({ companies: [...state.companies, data], isLoading: false }));
    } catch (error) {
      console.error("Failed to add company", error);
      set({ isLoading: false });
    }
  },

  deleteCompany: async (id) => {
    try {
      await api.delete(`/companies/${id}`);
      set((state) => ({
        companies: state.companies.filter((c) => c._id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete company", error);
    }
  },

  toggleAlert: async (id) => {
    try {
      const { data } = await api.patch(`/companies/${id}`);
      set((state) => ({
        companies: state.companies.map((c) =>
          c._id === id ? { ...c, alertActive: data.alertActive } : c
        )
      }));
    } catch (error) {
      console.error("Failed to toggle alert", error);
    }
  },

  updateSignalRealtime: (companyId, signalData) => {
    set((state) => ({
      companies: state.companies.map((c) => 
        c._id === companyId 
          ? { ...c, latestSignal: { ...c.latestSignal, ...signalData } } 
          : c
      )
    }));
  }
}));
