import { create } from 'zustand';
import type { IndustryId } from './types';

export type Tab =
  | 'businesses' | 'upgrades' | 'employees' | 'market'
  | 'clan' | 'rewards' | 'wheel' | 'ledger' | 'settings';

interface UIStore {
  tab: Tab;
  setTab: (t: Tab) => void;
  highlightedIndustry: IndustryId | null;
  highlightToken: number;
  focusIndustry: (id: IndustryId) => void;
  clearHighlight: () => void;
}

export const useUI = create<UIStore>((set) => ({
  tab: 'businesses',
  setTab: (tab) => set({ tab }),
  highlightedIndustry: null,
  highlightToken: 0,
  focusIndustry: (id) =>
    set((s) => ({ tab: 'market', highlightedIndustry: id, highlightToken: s.highlightToken + 1 })),
  clearHighlight: () => set({ highlightedIndustry: null }),
}));
