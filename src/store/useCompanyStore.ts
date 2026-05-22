import { create } from "zustand";
import api from "@/lib/api";

export interface Company {
  _id: string;
  name: string;
  website: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  domain?: string;
  latestNews?: Array<{
    title: string;
    url: string;
    publishedAt: string;
    source: string;
  }>;
}

interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  totalLimit: number;
  remainingLimit: number;
  fetchCompanies: () => Promise<void>;
  fetchCompanyDetails: (id: string) => Promise<void>;
  addCompany: (data: Partial<Company>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  selectedCompany: null,
  isLoading: false,
  totalLimit: 10,
  remainingLimit: 10,

  fetchCompanies: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/companies");
      set({ 
        companies: data.companies, 
        remainingLimit: data.remaining,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error(error);
    }
  },

  fetchCompanyDetails: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/companies/${id}`);
      set({ selectedCompany: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error(error);
    }
  },

  addCompany: async (companyData) => {
    set({ isLoading: true });
    try {
      await api.post("/companies", companyData);
      await get().fetchCompanies();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeCompany: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/companies/${id}`);
      await get().fetchCompanies();
      if (get().selectedCompany?._id === id) {
        set({ selectedCompany: null });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
