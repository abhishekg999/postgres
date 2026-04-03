import { create } from "zustand";
import type { PGlite } from "@electric-sql/pglite";
import type { TableInfo, DBStatus } from "@/types";
import { initDB, getSchema } from "@/lib/db";

interface DatabaseStore {
  db: PGlite | null;
  status: DBStatus;
  error: string | null;
  tables: TableInfo[];

  initialize: () => Promise<void>;
  refreshSchema: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  db: null,
  status: "idle",
  error: null,
  tables: [],

  initialize: async () => {
    if (get().status === "initializing" || get().status === "ready") return;

    set({ status: "initializing", error: null });
    try {
      const db = await initDB();
      const tables = await getSchema(db);
      set({ db, tables, status: "ready" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to initialize database",
      });
    }
  },

  refreshSchema: async () => {
    const { db } = get();
    if (!db) return;
    try {
      const tables = await getSchema(db);
      set({ tables });
    } catch {
      // Schema refresh failure is non-fatal
    }
  },
}));
