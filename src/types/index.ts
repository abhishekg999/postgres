export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

export interface QueryLog {
  id: string;
  sql: string;
  status: "success" | "error";
  message: string;
  executionTime: number;
  timestamp: number;
}

export interface Tab {
  id: string;
  name: string;
  sql: string;
  isDirty: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  status: "success" | "error";
  executionTime: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AIStatus = "idle" | "downloading" | "loading" | "ready" | "error";
export type DBStatus = "idle" | "initializing" | "ready" | "error";
