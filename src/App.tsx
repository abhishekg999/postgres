import { useEffect, useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useDatabaseStore } from "@/stores/database";
import { useEditorStore } from "@/stores/editor";
import { useResultsStore } from "@/stores/results";
import { useHistoryStore } from "@/stores/history";
import { executeQuery } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { TabBar } from "@/components/layout/TabBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { QueryEditor } from "@/components/editor/QueryEditor";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { AIPanel } from "@/components/ai/AIPanel";
import { Dialog } from "@/components/shared/Dialog";

export default function App() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const { db, status: dbStatus, initialize: initDB } = useDatabaseStore();
  const { getActiveTab } = useEditorStore();
  const { setResults, setError, setExecuting, addLog, isExecuting } = useResultsStore();
  const { saveQuery, addToHistory } = useHistoryStore();
  const refreshSchema = useDatabaseStore((s) => s.refreshSchema);

  // Initialize database on mount
  useEffect(() => {
    initDB();
  }, [initDB]);

  // Execute query
  const handleExecute = useCallback(async () => {
    const tab = getActiveTab();
    if (!tab || !db || isExecuting) return;

    const sql = tab.sql.trim();
    if (!sql) return;

    setExecuting(true);
    try {
      const result = await executeQuery(db, sql);
      setResults(result.rows, result.columns, result.executionTime);
      addLog({
        id: "",
        sql,
        status: "success",
        message: `${result.rowCount} rows returned`,
        executionTime: result.executionTime,
        timestamp: Date.now(),
      });
      addToHistory(sql, "success", result.executionTime);

      // Refresh schema in case DDL was executed
      if (/^\s*(CREATE|ALTER|DROP|TRUNCATE)/i.test(sql)) {
        refreshSchema();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Query failed";
      setError(message, sql, 0);
      addLog({
        id: "",
        sql,
        status: "error",
        message,
        executionTime: 0,
        timestamp: Date.now(),
      });
      addToHistory(sql, "error", 0);
    } finally {
      setExecuting(false);
    }
  }, [
    db,
    getActiveTab,
    isExecuting,
    setResults,
    setError,
    setExecuting,
    addLog,
    addToHistory,
    refreshSchema,
  ]);

  // Save query dialog
  const handleSave = useCallback(() => {
    const tab = getActiveTab();
    if (!tab) return;
    setSaveName(tab.name);
    setShowSaveDialog(true);
  }, [getActiveTab]);

  const handleSaveConfirm = () => {
    const tab = getActiveTab();
    if (!tab || !saveName.trim()) return;
    saveQuery(saveName.trim(), tab.sql);
    setShowSaveDialog(false);
    setSaveName("");
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "Enter") {
        e.preventDefault();
        handleExecute();
      } else if (meta && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (meta && e.key === "b") {
        e.preventDefault();
        setShowSidebar((s) => !s);
      } else if (meta && e.shiftKey && e.key === "j") {
        e.preventDefault();
        setShowAI((s) => !s);
      } else if (meta && e.key === "t") {
        e.preventDefault();
        useEditorStore.getState().addTab();
      } else if (meta && e.key === "w") {
        e.preventDefault();
        const { activeTabId, closeTab } = useEditorStore.getState();
        closeTab(activeTabId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleExecute, handleSave]);

  // Loading state
  if (dbStatus === "idle" || dbStatus === "initializing") {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-studio-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-studio-muted border-t-studio-accent" />
          <span className="text-sm text-studio-muted">Initializing database...</span>
        </div>
      </div>
    );
  }

  if (dbStatus === "error") {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-studio-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm text-studio-red">Failed to initialize database</span>
          <button
            onClick={initDB}
            className="px-4 py-2 bg-studio-accent text-black rounded-md text-sm font-medium hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-studio-bg text-studio-text overflow-hidden">
      {/* Sidebar */}
      {showSidebar && <Sidebar onToggleAI={() => setShowAI((s) => !s)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TabBar />

        <PanelGroup direction="vertical" className="flex-1">
          {/* Editor panel */}
          <Panel defaultSize={50} minSize={20}>
            <div className="flex flex-col h-full">
              <EditorToolbar onExecute={handleExecute} onSave={handleSave} />
              <div className="flex-1 min-h-0">
                <QueryEditor onExecute={handleExecute} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-studio-border hover:bg-studio-accent/50 transition-colors cursor-row-resize" />

          {/* Results panel */}
          <Panel defaultSize={50} minSize={15}>
            <ResultsPanel />
          </Panel>
        </PanelGroup>

        <StatusBar />
      </div>

      {/* AI Panel */}
      {showAI && <AIPanel onClose={() => setShowAI(false)} />}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} title="Save Query">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveConfirm()}
            placeholder="Query name"
            autoFocus
            className="w-full bg-studio-bg border border-studio-border rounded-md px-3 py-2 text-sm text-studio-text placeholder:text-studio-muted focus:outline-none focus:border-studio-accent transition-colors"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-4 py-2 text-sm text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfirm}
              disabled={!saveName.trim()}
              className="px-4 py-2 bg-studio-accent text-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
