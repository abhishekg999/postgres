import { useHistoryStore } from "@/stores/history";
import { useEditorStore } from "@/stores/editor";
import { FileText, Trash2 } from "lucide-react";

export function SavedQueries() {
  const { savedQueries, deleteSavedQuery } = useHistoryStore();
  const { updateSQL, activeTabId } = useEditorStore();

  const handleLoad = (sql: string) => {
    updateSQL(activeTabId, sql);
  };

  if (savedQueries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-xs text-studio-muted gap-2">
        <FileText className="w-6 h-6 text-studio-muted/40" />
        <span>No saved queries</span>
        <span className="text-2xs">
          Press <kbd className="font-mono bg-studio-active px-1.5 py-0.5 rounded text-2xs">⌘S</kbd>{" "}
          to save
        </span>
      </div>
    );
  }

  return (
    <div className="p-2">
      {savedQueries.map((q) => (
        <button
          key={q.id}
          onClick={() => handleLoad(q.sql)}
          className="group flex items-start gap-2.5 w-full px-3 py-2.5 rounded-md text-left hover:bg-studio-hover transition-colors"
        >
          <FileText className="w-4 h-4 text-studio-muted mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-studio-text truncate">{q.name}</div>
            <div className="text-2xs text-studio-muted truncate font-mono mt-0.5">{q.sql}</div>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              deleteSavedQuery(q.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-studio-active text-studio-muted hover:text-studio-red shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
