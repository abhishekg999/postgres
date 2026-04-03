import { useState, useMemo } from "react";
import { useResultsStore } from "@/stores/results";
import { DataGrid } from "./DataGrid";
import { ResultsToolbar } from "./ResultsToolbar";
import { Pagination } from "./Pagination";
import { exportToCsv } from "@/lib/csv";
import { AlertCircle } from "lucide-react";

const ROWS_PER_PAGE = 50;

export function ResultsPanel() {
  const { rows, columns, error, isExecuting, logs } = useResultsStore();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"results" | "logs">("results");

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      }),
    );
  }, [rows, columns, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const pagedRows = filteredRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleExport = () => {
    exportToCsv(columns, rows);
  };

  return (
    <div className="flex flex-col h-full bg-studio-bg">
      {/* View toggle */}
      <div className="flex h-9 shrink-0 items-center gap-1 px-2 border-b border-studio-border bg-studio-surface">
        <button
          onClick={() => setActiveView("results")}
          className={`px-4 py-1.5 text-xs rounded-md transition-colors ${
            activeView === "results"
              ? "text-studio-text bg-studio-active"
              : "text-studio-muted hover:text-studio-text hover:bg-studio-hover"
          }`}
        >
          Results
          {rows.length > 0 && (
            <span className="ml-1.5 text-2xs text-studio-muted">({rows.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveView("logs")}
          className={`px-4 py-1.5 text-xs rounded-md transition-colors ${
            activeView === "logs"
              ? "text-studio-text bg-studio-active"
              : "text-studio-muted hover:text-studio-text hover:bg-studio-hover"
          }`}
        >
          Logs
          {logs.length > 0 && (
            <span className="ml-1.5 text-2xs text-studio-muted">({logs.length})</span>
          )}
        </button>
      </div>

      {activeView === "results" ? (
        <>
          {error ? (
            <div className="flex items-start gap-3 p-4 text-xs text-studio-red">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="font-mono whitespace-pre-wrap">{error}</pre>
            </div>
          ) : isExecuting ? (
            <div className="flex items-center justify-center h-full text-sm text-studio-muted gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-studio-muted border-t-studio-accent" />
              Executing query...
            </div>
          ) : (
            <>
              <ResultsToolbar
                rowCount={filteredRows.length}
                onSearch={handleSearch}
                onExport={handleExport}
              />
              <div className="flex-1 overflow-hidden min-h-0">
                <DataGrid columns={columns} rows={pagedRows} />
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalRows={filteredRows.length}
                rowsPerPage={ROWS_PER_PAGE}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-studio-muted">
              No logs yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono hover:bg-studio-hover/50"
                >
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-2xs font-sans font-semibold ${
                      log.status === "success"
                        ? "bg-studio-accent/15 text-studio-accent"
                        : "bg-studio-red/15 text-studio-red"
                    }`}
                  >
                    {log.status === "success" ? "OK" : "ERR"}
                  </span>
                  <span className="text-studio-muted truncate flex-1">{log.sql}</span>
                  <span className="text-2xs text-studio-muted/60 shrink-0">
                    {log.executionTime}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
