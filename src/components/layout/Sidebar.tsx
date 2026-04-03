import { useState } from "react";
import { useDatabaseStore } from "@/stores/database";
import { TableBrowser } from "@/components/sidebar/TableBrowser";
import { SavedQueries } from "@/components/sidebar/SavedQueries";
import { QueryHistory } from "@/components/sidebar/QueryHistory";
import { Database, Bookmark, History, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type SidebarTab = "tables" | "saved" | "history";

interface SidebarProps {
  onToggleAI: () => void;
}

export function Sidebar({ onToggleAI }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("tables");
  const dbStatus = useDatabaseStore((s) => s.status);

  const tabs: { id: SidebarTab; icon: typeof Database; label: string }[] = [
    { id: "tables", icon: Database, label: "Tables" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    { id: "history", icon: History, label: "History" },
  ];

  return (
    <div className="flex flex-col h-full w-60 shrink-0 bg-studio-surface border-r border-studio-border">
      {/* Tab bar */}
      <div className="flex h-10 shrink-0 border-b border-studio-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs transition-colors",
              activeTab === tab.id
                ? "text-studio-text border-b-2 border-studio-accent"
                : "text-studio-muted hover:text-studio-text",
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {dbStatus !== "ready" ? (
          <div className="flex items-center justify-center h-32 text-xs text-studio-muted">
            {dbStatus === "error" ? "Connection error" : "Connecting..."}
          </div>
        ) : (
          <>
            {activeTab === "tables" && <TableBrowser />}
            {activeTab === "saved" && <SavedQueries />}
            {activeTab === "history" && <QueryHistory />}
          </>
        )}
      </div>

      {/* AI toggle */}
      <button
        onClick={onToggleAI}
        className="flex items-center gap-2 px-4 py-3 shrink-0 border-t border-studio-border text-xs text-studio-muted hover:text-studio-accent hover:bg-studio-hover transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Assistant</span>
        <span className="ml-auto font-mono text-2xs text-studio-muted/60">⌘⇧J</span>
      </button>
    </div>
  );
}
