export interface Shortcut {
  key: string;
  meta: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string;
}

export const shortcuts: Shortcut[] = [
  { key: "Enter", meta: true, description: "Execute query", action: "execute" },
  { key: "t", meta: true, description: "New tab", action: "newTab" },
  { key: "w", meta: true, description: "Close tab", action: "closeTab" },
  { key: "s", meta: true, description: "Save query", action: "saveQuery" },
  {
    key: "b",
    meta: true,
    description: "Toggle sidebar",
    action: "toggleSidebar",
  },
  {
    key: "j",
    meta: true,
    shift: true,
    description: "Toggle AI panel",
    action: "toggleAI",
  },
  {
    key: "l",
    meta: true,
    shift: true,
    description: "Clear logs",
    action: "clearLogs",
  },
];
