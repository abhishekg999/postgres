import { useEditorStore } from "@/stores/editor";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useEditorStore();

  return (
    <div className="flex h-10 shrink-0 bg-studio-surface border-b border-studio-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "group flex items-center gap-2 px-5 h-full text-xs border-r border-studio-border shrink-0 transition-colors",
            tab.id === activeTabId
              ? "bg-studio-bg text-studio-text"
              : "text-studio-muted hover:bg-studio-hover",
          )}
        >
          <span className="truncate max-w-40">
            {tab.isDirty && <span className="text-studio-accent mr-1">*</span>}
            {tab.name}
          </span>
          {tabs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-studio-active ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      ))}
      <button
        onClick={() => addTab()}
        className="flex items-center justify-center w-10 h-full text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
