"use client";

import { useCallback, useState } from "react";
import { useLocalStorage } from "react-use";

import Editor from "@/components/Editor";
import { Header } from "@/components/Header";
import { OutputLogs } from "@/components/OutputLogs";
import ResultsTable from "@/components/ResultsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { exportResultsToCSV } from "@/lib/utils";
import { useDatabaseStore } from "@/store/database";
import { HistoryItem, SavedQuery } from "@/types/types";
import {
  Bookmark,
  Check,
  Clock,
  Copy,
  Database,
  Download,
  FileText,
  TableIcon,
} from "lucide-react";

export default function SQLEditor() {
  // UI state
  const [activeTab, setActiveTab] = useState("editor");
  const [resultsTab, setResultsTab] = useState("table");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState("");

  // Query state
  const [query, setQuery] = useState("SELECT * FROM users");
  const [savedQueries, setSavedQueries] = useLocalStorage<SavedQuery[]>(
    "savedQueries",
    []
  );
  const [queryHistory, setQueryHistory] = useLocalStorage<HistoryItem[]>(
    "queryHistory",
    []
  );

  // Database store
  const {
    isExecuting,
    tables,
    queryLogs,
    results,
    columns,
    setQueryLogs,
    dbInitialized,
    runQuery,
  } = useDatabaseStore();
  const { toast } = useToast();

  // Functions
  const executeQuery = useCallback(
    async (query: string) => {
      if (!dbInitialized) {
        toast({
          title: "Database not ready",
          description: "Please wait for the database to initialize",
          variant: "destructive",
        });
        return;
      }

      if (!query.trim()) {
        toast({
          title: "Empty query",
          description: "Please enter a SQL query to execute",
          variant: "destructive",
        });
        return;
      }

      try {
        const result = await runQuery(query);

        if (!result) {
          toast({
            title: "Query execution failed",
            description: "No result returned from the database",
            variant: "destructive",
          });
          return;
        }

        // Add to history
        const newHistoryItem = {
          id: Date.now().toString(),
          query,
          timestamp: Date.now(),
        };

        if (queryHistory) {
          const updatedHistory = [newHistoryItem, ...queryHistory].slice(
            0,
            100
          );
          setQueryHistory(updatedHistory);
        }

        // Switch to results tab on success
        if (result.status === "success") {
          setActiveTab("results");
        }
      } catch (error) {
        console.error("Query execution error:", error);
      }
    },
    [dbInitialized, runQuery, setQueryHistory, toast, queryHistory]
  );

  const saveQuery = useCallback(() => {
    if (!queryName.trim()) {
      toast({
        title: "Missing name",
        description: "Please provide a name for your query",
        variant: "destructive",
      });
      return;
    }

    const newSavedQuery = {
      id: Date.now().toString(),
      name: queryName,
      query,
    };

    if (savedQueries) {
      const updatedQueries = [...savedQueries, newSavedQuery].slice(0, 50);
      setSavedQueries(updatedQueries);
    }

    setSaveDialogOpen(false);
    setQueryName("");

    toast({
      title: "Query saved",
      description: `"${queryName}" has been saved successfully`,
    });
  }, [query, queryName, savedQueries, setSavedQueries, toast]);

  const loadQuery = useCallback(
    (savedQuery: SavedQuery) => {
      setQuery(savedQuery.query);
      setActiveTab("editor");

      toast({
        title: "Query loaded",
        description: `"${savedQuery.name}" has been loaded into the editor`,
      });
    },
    [toast]
  );

  const loadHistoryQuery = useCallback(
    (historyItem: HistoryItem) => {
      setQuery(historyItem.query);
      setActiveTab("editor");

      toast({
        title: "Query loaded from history",
        description: "Historical query has been loaded into the editor",
      });
    },
    [toast]
  );

  const deleteQuery = useCallback(
    (id: string) => {
      const updatedQueries = savedQueries?.filter((q) => q.id !== id) || [];
      setSavedQueries(updatedQueries);

      toast({
        title: "Query deleted",
        description: "The saved query has been deleted",
      });
    },
    [savedQueries, setSavedQueries, toast]
  );

  const exportResults = useCallback(() => {
    if (results.length === 0) {
      toast({
        title: "No results to export",
        description: "Execute a query first to export results",
        variant: "destructive",
      });
      return;
    }

    try {
      exportResultsToCSV(
        results,
        `query-results-${new Date().toISOString().slice(0, 19)}.csv`
      );
      toast({
        title: "Export successful",
        description: "Results have been exported as CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not export results",
        variant: "destructive",
      });
    }
  }, [results, toast]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, []);

  return (
    <div className="flex h-screen bg-[#111827]">
      <div className="w-64 h-full border-r border-[#2D3748] bg-[#1A202C] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#2D3748]">
          <div className="flex items-center gap-2">
            <Database
              className={`h-5 w-5 ${
                dbInitialized ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            />
            <h2 className="font-semibold text-[#E2E8F0]">Postgres Editor</h2>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center text-[#A0AEC0] text-xs font-medium mb-2">
            <Database className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Database</span>
          </div>

          <div className="space-y-1 mb-2">
            {tables.map((table) => (
              <Button
                key={table}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#E2E8F0] hover:bg-[#2D3748] h-8"
                onClick={() => setQuery(`SELECT * FROM ${table} LIMIT 100`)}
              >
                <TableIcon className="h-4 w-4 mr-2 text-[#10B981] flex-shrink-0" />
                <span className="truncate">{table}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-[#2D3748] my-2" />

        <div className="flex-1 flex flex-col px-2 overflow-hidden">
          <Tabs defaultValue="saved" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 bg-[#2D3748]">
              <TabsTrigger
                value="saved"
                className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                <Bookmark className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Saved</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
              >
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="flex-1 mt-2">
              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="space-y-2 pr-2">
                  {(savedQueries ?? []).length === 0 ? (
                    <p className="text-sm text-[#A0AEC0] p-2">
                      No saved queries yet
                    </p>
                  ) : (
                    (savedQueries ?? []).map((savedQuery) => (
                      <div
                        key={savedQuery.id}
                        className="group rounded-md border border-[#2D3748] p-2 hover:bg-[#2D3748] cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex-1 truncate text-sm font-medium text-[#E2E8F0]"
                            onClick={() => loadQuery(savedQuery)}
                          >
                            {savedQuery.name}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[#A0AEC0] hover:text-white hover:bg-[#374151] flex-shrink-0"
                            onClick={() => deleteQuery(savedQuery.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                        <p className="text-xs text-[#A0AEC0] truncate mt-1">
                          {savedQuery.query.substring(0, 50)}
                          {savedQuery.query.length > 50 ? "..." : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-2">
              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="space-y-2 pr-2">
                  {(queryHistory ?? []).length === 0 ? (
                    <p className="text-sm text-[#A0AEC0] p-2">
                      No query history yet
                    </p>
                  ) : (
                    (queryHistory ?? []).map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="rounded-md border border-[#2D3748] p-2 hover:bg-[#2D3748] cursor-pointer"
                        onClick={() => loadHistoryQuery(historyItem)}
                      >
                        <p className="text-xs text-[#A0AEC0] truncate">
                          {new Date(historyItem.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs truncate mt-1 text-[#E2E8F0]">
                          {historyItem.query}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-[#2D3748]">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-[#E2E8F0] bg-[#2D3748] h-8"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Bookmark className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Save Query</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header query={query} onRunQuery={executeQuery} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-center px-4 pt-4">
              <TabsList className="bg-[#2D3748]">
                <TabsTrigger
                  value="editor"
                  className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
                >
                  Results {results.length > 0 && `(${results.length})`}
                </TabsTrigger>
              </TabsList>

              {activeTab === "results" && results.length > 0 && (
                <div className="flex items-center gap-2">
                  <TabsList className="bg-[#2D3748]">
                    <TabsTrigger
                      value="table"
                      onClick={() => setResultsTab("table")}
                      className={`${
                        resultsTab === "table" ? "bg-[#374151] text-white" : ""
                      }`}
                    >
                      Table
                    </TabsTrigger>
                    <TabsTrigger
                      value="json"
                      disabled={true}
                      onClick={() => setResultsTab("json")}
                      className={`${
                        resultsTab === "json" ? "bg-[#374151] text-white" : ""
                      }`}
                    >
                      JSON
                    </TabsTrigger>
                  </TabsList>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportResults}
                    className="border-[#4A5568] bg-[#2D3748] hover:bg-[#374151] text-white"
                  >
                    <Download className="h-4 w-4 mr-2 text-[#A0AEC0]" />
                    Export
                  </Button>
                </div>
              )}
            </div>

            <TabsContent
              value="editor"
              className="flex-1 p-4 pt-2 overflow-hidden"
            >
              <div className="h-full border border-[#2D3748] rounded-md mt-2 overflow-hidden">
                <Editor
                  value={query}
                  onChange={setQuery}
                  language="sql"
                  readOnly={isExecuting}
                  onExecuteQuery={executeQuery}
                />
              </div>
            </TabsContent>

            <TabsContent value="results" className="flex-1 p-4 pt-2">
              {results.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#A0AEC0]">
                  <p>No results to display. Run a query to see results.</p>
                </div>
              ) : (
                <div className="border border-[#2D3748] rounded-md overflow-hidden mt-2 bg-[#1A202C] h-full">
                  {resultsTab === "table" ? (
                    <ResultsTable columns={columns} data={results} />
                  ) : (
                    <div className="relative h-full">
                      <ScrollArea className="h-full p-4">
                        <pre className="text-[#E2E8F0] text-sm font-mono whitespace-pre-wrap">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      </ScrollArea>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(results, null, 2))
                        }
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-[#2D3748] hover:bg-[#374151]"
                      >
                        {copySuccess ? (
                          <Check className="h-4 w-4 text-[#10B981]" />
                        ) : (
                          <Copy className="h-4 w-4 text-[#A0AEC0]" />
                        )}
                        <span className="sr-only">Copy to clipboard</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <OutputLogs queryLogs={queryLogs} setQueryLogs={setQueryLogs} />
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="bg-[#1A202C] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="query-name" className="text-[#E2E8F0]">
                Query Name
              </Label>
              <Input
                id="query-name"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="My awesome query"
                className="bg-[#2D3748] border-[#4A5568] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              className="border-[#4A5568] bg-[#2D3748] hover:bg-[#374151] text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveQuery}
              className="bg-[#10B981] hover:bg-[#059669] text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
