export type SavedQuery = {
  id: string;
  name: string;
  query: string;
};

export type HistoryItem = {
  id: string;
  query: string;
  timestamp: number;
};

export type QueryLog = {
  message: string;
  status: "success" | "error";
  timestamp: number;
  duration?: number;
};
