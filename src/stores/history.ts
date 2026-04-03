import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedQuery, HistoryItem } from "@/types";

interface HistoryStore {
  savedQueries: SavedQuery[];
  history: HistoryItem[];

  saveQuery: (name: string, sql: string) => void;
  deleteSavedQuery: (id: string) => void;
  addToHistory: (sql: string, status: "success" | "error", executionTime: number) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      savedQueries: [],
      history: [],

      saveQuery: (name, sql) =>
        set((state) => ({
          savedQueries: [
            { id: `sq-${Date.now()}`, name, sql, createdAt: Date.now() },
            ...state.savedQueries,
          ].slice(0, 100),
        })),

      deleteSavedQuery: (id) =>
        set((state) => ({
          savedQueries: state.savedQueries.filter((q) => q.id !== id),
        })),

      addToHistory: (sql, status, executionTime) =>
        set((state) => ({
          history: [
            {
              id: `h-${Date.now()}`,
              sql,
              timestamp: Date.now(),
              status,
              executionTime,
            },
            ...state.history,
          ].slice(0, 200),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "pgide-history",
    },
  ),
);
