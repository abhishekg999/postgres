import { executeQuery, getTables, initDB, QueryResult } from "@/lib/db";
import { QueryLog } from "@/types/types";
import { PGlite } from "@electric-sql/pglite";
import { create } from "zustand";

interface DatabaseState {
  // State properties
  dbInstance: PGlite | null;
  isExecuting: boolean;
  dbInitialized: boolean;
  isInitializing: boolean;
  tables: string[];
  tableSchema: Record<string, string[]>;
  queryLogs: QueryLog[];
  results: QueryResult["rows"];
  columns: string[];

  // Actions
  initializeDb: () => Promise<void>;
  runQuery: (query: string) => Promise<QueryResult | null>;
  refreshTables: () => Promise<void>;
  setQueryLogs: (logs: QueryLog[]) => void;
  checkDbStatus: () => boolean;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  // Initial state
  dbInstance: null,
  isExecuting: false,
  dbInitialized: false,
  isInitializing: false,
  tables: [],
  tableSchema: {},
  queryLogs: [],
  results: [],
  columns: [],

  // Actions
  initializeDb: async () => {
    const { isInitializing, dbInstance } = get();
    if (dbInstance || isInitializing) return;

    set({ isInitializing: true });

    try {
      const dbInstance = await initDB();
      set({
        dbInstance,
        dbInitialized: true,
      });
      get().refreshTables();
    } catch (error) {
      console.error("Failed to initialize database:", error);
    } finally {
      set({ isInitializing: false });
    }
  },

  runQuery: async (query: string) => {
    const { dbInstance } = get();

    if (!dbInstance) return null;
    if (!query.trim()) return null;

    set({ isExecuting: true });

    try {
      const result = await executeQuery(dbInstance, query);

      const newLog = {
        message: result.message,
        status: result.status,
        timestamp: Date.now(),
        duration: result.duration,
      };

      set((state) => ({
        queryLogs: [newLog, ...state.queryLogs].slice(0, 50),
      }));

      if (Array.isArray(result.rows) && result.rows.length > 0) {
        set({
          columns: Object.keys(result.rows[0]),
          results: result.rows,
        });
      } else {
        set({ columns: [], results: [] });
      }

      get().refreshTables();

      return result;
    } catch (error) {
      console.error("Query execution error:", error);

      const newLog = {
        message:
          (error as Error).message ||
          "An error occurred during query execution",
        status: "error" as const,
        timestamp: Date.now(),
      };

      set((state) => ({
        queryLogs: [newLog, ...state.queryLogs].slice(0, 50),
      }));

      return null;
    } finally {
      set({ isExecuting: false });
    }
  },

  refreshTables: async () => {
    const { dbInstance } = get();
    if (!dbInstance) return;

    try {
      const tableList = await getTables(dbInstance);
      set({
        tables: Object.keys(tableList),
        tableSchema: tableList,
      });
    } catch (error) {
      console.error("Failed to refresh tables:", error);
    }
  },

  setQueryLogs: (logs: QueryLog[]) => {
    set({ queryLogs: logs });
  },

  checkDbStatus: () => {
    const { dbInstance } = get();
    const isInitialized = dbInstance !== null;
    set({ dbInitialized: isInitialized });
    return isInitialized;
  },
}));

// Auto-initialize database when the store is imported
useDatabaseStore.getState().initializeDb();
