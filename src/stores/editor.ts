import { create } from "zustand";
import type { Tab } from "@/types";

interface EditorStore {
  tabs: Tab[];
  activeTabId: string;

  addTab: (name?: string, sql?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateSQL: (id: string, sql: string) => void;
  renameTab: (id: string, name: string) => void;
  getActiveTab: () => Tab | undefined;
}

let tabCounter = 1;

function createTab(name?: string, sql?: string): Tab {
  const id = `tab-${Date.now()}-${tabCounter}`;
  return {
    id,
    name: name ?? `Query ${tabCounter++}`,
    sql: sql ?? "SELECT * FROM users LIMIT 100;",
    isDirty: false,
  };
}

const initialTab = createTab();

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,

  addTab: (name?, sql?) => {
    const tab = createTab(name, sql);
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;

    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);

    let newActiveId = activeTabId;
    if (activeTabId === id) {
      newActiveId = newTabs[Math.min(idx, newTabs.length - 1)].id;
    }

    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateSQL: (id, sql) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, sql, isDirty: true } : t)),
    })),

  renameTab: (id, name) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
    })),

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },
}));
