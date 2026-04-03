import { create } from "zustand";
import type { ChatMessage, AIStatus } from "@/types";
import { useDatabaseStore } from "@/stores/database";
import { DEFAULT_MODEL } from "@/config/models";

interface AIStore {
  status: AIStatus;
  progress: number;
  progressText: string;
  modelId: string;
  messages: ChatMessage[];
  isGenerating: boolean;
  worker: Worker | null;

  initialize: () => void;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  setModel: (modelId: string) => void;
}

function buildSystemPrompt(): string {
  const tables = useDatabaseStore.getState().tables;
  if (tables.length === 0) {
    return "You are a PostgreSQL SQL assistant. Help the user write SQL queries. Be concise. Return only SQL when asked for queries.";
  }

  const ddl = tables
    .map((t) => {
      const cols = t.columns
        .map((c) => `  ${c.name} ${c.type}${c.nullable ? "" : " NOT NULL"}`)
        .join(",\n");
      return `CREATE TABLE ${t.name} (\n${cols}\n);`;
    })
    .join("\n\n");

  return `You are a PostgreSQL SQL assistant. The database has these tables:\n\n${ddl}\n\nHelp the user write SQL queries. Be concise. Return only SQL when asked for queries. Use PostgreSQL syntax.`;
}

export const useAIStore = create<AIStore>((set, get) => ({
  status: "idle",
  progress: 0,
  progressText: "",
  modelId: DEFAULT_MODEL.id,
  messages: [],
  isGenerating: false,
  worker: null,

  initialize: () => {
    const { status, modelId } = get();
    if (status !== "idle" && status !== "error") return;

    const worker = new Worker(new URL("../workers/ai.worker.ts", import.meta.url), {
      type: "module",
    });

    set({
      worker,
      status: "downloading",
      progress: 0,
      progressText: "Starting download...",
    });

    worker.onmessage = (e) => {
      const { type, ...data } = e.data;

      switch (type) {
        case "progress":
          set({ progress: data.progress, progressText: data.text });
          if (data.progress > 50) set({ status: "loading" });
          break;

        case "ready":
          set({ status: "ready", progress: 100, progressText: "Model ready" });
          break;

        case "chunk":
          set((state) => {
            const msgs = [...state.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = {
                ...last,
                content: last.content + data.content,
              };
            }
            return { messages: msgs };
          });
          break;

        case "done":
          set({ isGenerating: false });
          break;

        case "error":
          set((state) => ({
            isGenerating: false,
            status: state.status === "ready" ? "ready" : "error",
          }));
          // Add error message to chat
          set((state) => ({
            messages: [...state.messages, { role: "assistant", content: `Error: ${data.error}` }],
          }));
          break;
      }
    };

    worker.postMessage({ type: "init", modelId });
  },

  sendMessage: (content) => {
    const { worker, status, messages } = get();
    if (!worker || status !== "ready") return;

    const userMsg: ChatMessage = { role: "user", content };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };

    const newMessages = [...messages, userMsg, assistantMsg];
    set({ messages: newMessages, isGenerating: true });

    const systemPrompt = buildSystemPrompt();
    worker.postMessage({
      type: "chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...newMessages.filter((m) => m.role !== "system" && m.content !== ""),
      ],
    });
  },

  clearChat: () => set({ messages: [] }),

  setModel: (modelId) => {
    const { worker } = get();
    if (worker) worker.terminate();
    set({
      modelId,
      status: "idle",
      progress: 0,
      progressText: "",
      messages: [],
      isGenerating: false,
      worker: null,
    });
  },
}));
