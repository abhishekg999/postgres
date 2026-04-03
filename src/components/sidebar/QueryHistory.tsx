import { useHistoryStore } from "@/stores/history";
import { useEditorStore } from "@/stores/editor";
import { Clock, Trash2 } from "lucide-react";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function QueryHistory() {
  const { history, clearHistory } = useHistoryStore();
  const { updateSQL, activeTabId } = useEditorStore();

  const handleLoad = (sql: string) => {
    updateSQL(activeTabId, sql);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-xs text-studio-muted gap-2">
        <Clock className="w-6 h-6 text-studio-muted/40" />
        <span>No history yet</span>
        <span className="text-2xs">Run a query to start</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-studio-border">
        <span className="text-2xs text-studio-muted">{history.length} queries</span>
        <button
          onClick={clearHistory}
          className="text-2xs text-studio-muted hover:text-studio-red transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => handleLoad(item.sql)}
            className="flex items-start gap-2.5 w-full px-3 py-2.5 rounded-md text-left hover:bg-studio-hover transition-colors"
          >
            <span
              className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${
                item.status === "success" ? "bg-studio-accent" : "bg-studio-red"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-2xs text-studio-muted font-mono truncate">{item.sql}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xs text-studio-muted/60">{timeAgo(item.timestamp)}</span>
                <span className="text-2xs text-studio-muted/60">{item.executionTime}ms</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
