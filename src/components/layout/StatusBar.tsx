import { useDatabaseStore } from "@/stores/database";
import { useResultsStore } from "@/stores/results";

export function StatusBar() {
  const dbStatus = useDatabaseStore((s) => s.status);
  const executionTime = useResultsStore((s) => s.executionTime);
  const rowCount = useResultsStore((s) => s.rows.length);
  const isExecuting = useResultsStore((s) => s.isExecuting);

  return (
    <div className="flex items-center justify-between h-7 shrink-0 px-4 bg-studio-surface border-t border-studio-border text-2xs text-studio-muted">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === "ready"
                ? "bg-studio-accent"
                : dbStatus === "error"
                  ? "bg-studio-red"
                  : "bg-studio-yellow animate-pulse"
            }`}
          />
          {dbStatus === "ready" ? "Connected" : dbStatus === "error" ? "Error" : "Connecting..."}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isExecuting && <span className="animate-pulse">Executing...</span>}
        {executionTime !== null && !isExecuting && <span>{executionTime}ms</span>}
        {rowCount > 0 && !isExecuting && (
          <span>
            {rowCount} row{rowCount !== 1 ? "s" : ""}
          </span>
        )}
        <span className="text-studio-muted/50">⌘+Enter run</span>
      </div>
    </div>
  );
}
