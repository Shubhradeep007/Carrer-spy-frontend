import { create } from "zustand";

interface UIState {
  isLoginModalOpen: boolean;
  isJobModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openJobModal: () => void;
  closeJobModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoginModalOpen: false,
  isJobModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  openJobModal: () => set({ isJobModalOpen: true }),
  closeJobModal: () => set({ isJobModalOpen: false }),
}));
