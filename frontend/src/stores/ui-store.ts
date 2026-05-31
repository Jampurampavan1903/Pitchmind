import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModal: (modal) => set({ activeModal: modal }),
}));
