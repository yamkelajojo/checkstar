import { create } from 'zustand';

export const useNavigationSignal = create<{ v: number; signal: () => void }>((set) => ({
  v: 0,
  signal: () => set((s) => ({ v: s.v + 1 })),
}));