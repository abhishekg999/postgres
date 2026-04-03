import { create } from "zustand";
import type { QueryLog } from "@/types";

interface ResultsStore {
  rows: Record<string, unknown>[];
  columns: string[];
  executionTime: number | null;
  error: string | null;
  isExecuting: boolean;
  logs: QueryLog[];

  setResults: (rows: Record<string, unknown>[], columns: string[], executionTime: number) => void;
  setError: (error: string, sql: string, executionTime: number) => void;
  setExecuting: (executing: boolean) => void;
  clearResults: () => void;
  addLog: (log: QueryLog) => void;
  clearLogs: () => void;
}

let logId = 0;

export const useResultsStore = create<ResultsStore>((set) => ({
  rows: [],
  columns: [],
  executionTime: null,
  error: null,
  isExecuting: false,
  logs: [],

  setResults: (rows, columns, executionTime) =>
    set({
      rows,
      columns,
      executionTime,
      error: null,
    }),

  setError: (error) =>
    set({
      error,
      rows: [],
      columns: [],
    }),

  setExecuting: (isExecuting) => set({ isExecuting }),

  clearResults: () =>
    set({
      rows: [],
      columns: [],
      executionTime: null,
      error: null,
    }),

  addLog: (log) =>
    set((state) => ({
      logs: [{ ...log, id: String(++logId) }, ...state.logs].slice(0, 200),
    })),

  clearLogs: () => set({ logs: [] }),
}));
