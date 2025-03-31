"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Play,
  Save,
  Database,
  Clock,
  Bookmark,
  Download,
  MoreVertical,
  ChevronDown,
  TableIcon,
  FileText,
  Terminal,
  Copy,
  Check,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Editor from "@/components/editor"
import ResultsTable from "@/components/results-table"
import { initDB, executeQuery, getTableList, QueryResult } from "@/lib/db"
import { useLocalStorage } from "react-use";


type SavedQuery = {
  id: string
  name: string
  query: string
}

type HistoryItem = {
  id: string
  query: string
  timestamp: number
}

type QueryLog = {
  message: string
  status: "success" | "error"
  timestamp: number
  duration?: number
}

export default function SQLEditor() {
  const [query, setQuery] = useState("SELECT * FROM users")
  const [results, setResults] = useState<QueryResult["rows"]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [resultsTab, setResultsTab] = useState("table")

  const [savedQueries, setSavedQueries] = useLocalStorage<SavedQuery[]>('savedQueries', []);
  const [queryHistory, setQueryHistory] = useLocalStorage<HistoryItem[]>('queryHistory', []);
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [queryName, setQueryName] = useState("")
  const [dbInitialized, setDbInitialized] = useState(false)
  const [tables, setTables] = useState<string[]>([])
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB()
        setDbInitialized(true)
        setTables(await getTableList())

        toast({
          title: "Database connected",
          description: "Ready to execute SQL queries",
        })
      } catch (error) {
        console.error("Failed to initialize database:", error)
        toast({
          title: "Database connection failed",
          description: "Could not connect to the database",
          variant: "destructive",
        })
      }
    }

    initialize()
  }, [toast])

  const runQuery = async () => {
    if (!dbInitialized) {
      toast({
        title: "Database not ready",
        description: "Please wait for the database to initialize",
        variant: "destructive",
      })
      return
    }

    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a SQL query to execute",
        variant: "destructive",
      })
      return
    }

    setIsExecuting(true)

    try {
      const result = await executeQuery(query)

      // Add to history
      const newHistoryItem = {
        id: Date.now().toString(),
        query,
        timestamp: Date.now(),
      }

      if (queryHistory) {
        const updatedHistory = [newHistoryItem, ...queryHistory].slice(0, 100)
        setQueryHistory(updatedHistory)
      }
        
      const newLog = {
        message: result.message,
        status: result.status,
        timestamp: Date.now(),
        duration: result.duration,
      }
      setQueryLogs((prev) => [newLog, ...prev].slice(0, 50))

      if (Array.isArray(result.rows) && result.rows.length > 0) {
        setColumns(Object.keys(result.rows[0]))
        setResults(result.rows)
        setActiveTab("results")
      } else {
        setColumns([])
        setResults([])
      }

      setTables(await getTableList())

      toast({
        title: result.status === "success" ? "Query executed" : "Query failed",
        description: result.message,
        variant: result.status === "success" ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Query execution error:", error)

      // Add to logs
      const newLog = {
        message: (error as Error).message || "An error occurred during query execution",
        status: "error",
        timestamp: Date.now(),
      } as const;

      setQueryLogs((prev) => [newLog, ...prev].slice(0, 50))

      toast({
        title: "Query failed",
        description: (error as Error).message || "An error occurred during query execution",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = () => {
    if (!queryName.trim()) {
      toast({
        title: "Missing name",
        description: "Please provide a name for your query",
        variant: "destructive",
      })
      return
    }

    const newSavedQuery = {
      id: Date.now().toString(),
      name: queryName,
      query,
    }

    if (savedQueries) {
      const updatedQueries = [...savedQueries, newSavedQuery].slice(0, 50)
      setSavedQueries(updatedQueries)
    }

    setSaveDialogOpen(false)
    setQueryName("")

    toast({
      title: "Query saved",
      description: `"${queryName}" has been saved successfully`,
    })
  }

  const loadQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query)
    setActiveTab("editor")

    toast({
      title: "Query loaded",
      description: `"${savedQuery.name}" has been loaded into the editor`,
    })
  }

  const loadHistoryQuery = (historyItem: HistoryItem) => {
    setQuery(historyItem.query)
    setActiveTab("editor")

    toast({
      title: "Query loaded from history",
      description: "Historical query has been loaded into the editor",
    })
  }

  const deleteQuery = (id: string) => {
    const updatedQueries = savedQueries?.filter((q) => q.id !== id) || []
    setSavedQueries(updatedQueries)

    toast({
      title: "Query deleted",
      description: "The saved query has been deleted",
    })
  }

  const exportResults = () => {
    if (results.length === 0) {
      toast({
        title: "No results to export",
        description: "Execute a query first to export results",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(results)
      const csv = [
        columns.join(","),
        ...results.map((row) => columns.map((col) => JSON.stringify(row[col] || "")).join(",")),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `query-results-${new Date().toISOString().slice(0, 19)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: "Results have been exported as CSV",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "Could not export results",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="flex flex-col h-screen bg-[#111827]">
      {/* Header */}
      <header className="border-b border-[#2D3748] px-6 py-3 flex items-center justify-between bg-[#1A202C]">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[#10B981]" />
          <h1 className="text-xl font-bold text-white">Postgres Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!query.trim() || isExecuting}
                  className="border-[#4A5568] bg-[#2D3748] hover:bg-[#374151] text-white"
                >
                  <Save className="h-4 w-4 mr-2 text-[#A0AEC0]" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save current query</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={runQuery}
                  disabled={!dbInitialized || isExecuting || !query.trim()}
                  className="bg-[#10B981] hover:bg-[#059669] text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </TooltipTrigger>
              <TooltipContent>Execute query</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 min-w-64 flex-shrink-0 border-r border-[#2D3748] bg-[#1E293B] flex flex-col">
          {/* Database Section */}
          <div className="p-4">
            <h2 className="text-sm font-semibold text-[#E2E8F0] mb-2">Database</h2>
            <div className="space-y-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-[#E2E8F0] hover:bg-[#2D3748]">
                    Tables
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-[#1A202C] border-[#2D3748]">
                  {tables.map((table) => (
                    <DropdownMenuItem
                      key={table}
                      onClick={() => setQuery(`SELECT * FROM ${table} LIMIT 100`)}
                      className="text-[#E2E8F0] focus:bg-[#2D3748] focus:text-white"
                    >
                      <TableIcon className="h-4 w-4 mr-2 text-[#10B981]" />
                      {table}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="bg-[#2D3748]" />

          {/* Saved Queries & History */}
          <Tabs defaultValue="saved" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mx-4 mt-4 bg-[#2D3748]">
              <TabsTrigger value="saved" className="data-[state=active]:bg-[#374151] data-[state=active]:text-white">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-[#374151] data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Saved Queries Tab */}
            <TabsContent value="saved" className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {(savedQueries ?? []).length === 0 ? (
                    <p className="text-sm text-[#A0AEC0] p-2">No saved queries yet</p>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[#A0AEC0] hover:text-white hover:bg-[#374151]"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A202C] border-[#2D3748]">
                              <DropdownMenuItem
                                onClick={() => loadQuery(savedQuery)}
                                className="text-[#E2E8F0] focus:bg-[#2D3748] focus:text-white"
                              >
                                Load
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteQuery(savedQuery.id)}
                                className="text-[#E2E8F0] focus:bg-[#2D3748] focus:text-white"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {(queryHistory ?? []).length === 0 ? (
                    <p className="text-sm text-[#A0AEC0] p-2">No query history yet</p>
                  ) : (
                    (queryHistory ?? []).map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="rounded-md border border-[#2D3748] p-2 hover:bg-[#2D3748] cursor-pointer"
                        onClick={() => loadHistoryQuery(historyItem)}
                      >
                        <p className="text-xs text-[#A0AEC0]">{new Date(historyItem.timestamp).toLocaleString()}</p>
                        <p className="text-xs truncate mt-1 text-[#E2E8F0] overflow-ellipsis overflow-x-scroll max-w-28">
                          {historyItem.query}
                          {/* {historyItem.query.substring(0, 30)}
                          {historyItem.query.length > 30 ? "..." : ""} */}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor & Results Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="flex justify-between items-center px-4 pt-4">
              <TabsList className="bg-[#2D3748]">
                <TabsTrigger value="editor" className="data-[state=active]:bg-[#374151] data-[state=active]:text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="data-[state=active]:bg-[#374151] data-[state=active]:text-white"
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Results {results.length > 0 && `(${results.length})`}
                </TabsTrigger>
              </TabsList>

              {/* Results View Options */}
              {activeTab === "results" && results.length > 0 && (
                <div className="flex items-center gap-2">
                  <TabsList className="bg-[#2D3748]">
                    <TabsTrigger
                      value="table"
                      onClick={() => setResultsTab("table")}
                      className={`${resultsTab === "table" ? "bg-[#374151] text-white" : ""}`}
                    >
                      Table
                    </TabsTrigger>
                    <TabsTrigger
                      value="json"
                      onClick={() => setResultsTab("json")}
                      className={`${resultsTab === "json" ? "bg-[#374151] text-white" : ""}`}
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

            {/* Editor Tab */}
            <TabsContent value="editor" className="flex-1 p-4 pt-2">
              <div className="h-full border border-[#2D3748] rounded-md mt-2 overflow-hidden relative">
                <Editor value={query} onChange={setQuery} language="sql" readOnly={isExecuting} />
              </div>
            </TabsContent>

            {/* Results Tab */}
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
                        onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
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

          {/* Output Logs */}
          <div className="border-t border-[#2D3748] bg-[#1A202C]">
            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#E2E8F0] flex items-center">
                <Terminal className="h-4 w-4 mr-2 text-[#A0AEC0]" />
                Output Logs
              </h3>
              {queryLogs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQueryLogs([])}
                  className="h-7 text-xs text-[#A0AEC0] hover:text-white hover:bg-[#2D3748]"
                >
                  Clear
                </Button>
              )}
            </div>
            <ScrollArea className="h-32">
              <div className="p-2 space-y-1">
                {queryLogs.length === 0 ? (
                  <p className="text-xs text-[#A0AEC0] p-2">No logs yet. Execute a query to see output.</p>
                ) : (
                  queryLogs.map((log, index) => (
                    <div key={index} className="text-xs p-2 rounded bg-[#1E293B] border border-[#2D3748]">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={log.status === "success" ? "default" : "destructive"}
                          className={log.status === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"}
                        >
                          {log.status === "success" ? "SUCCESS" : "ERROR"}
                        </Badge>
                        <span className="text-[#A0AEC0]">{formatTimestamp(log.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-[#E2E8F0]">{log.message}</p>
                      {log.duration && <p className="mt-1 text-[#A0AEC0]">Execution time: {log.duration}ms</p>}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Save Query Dialog */}
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
            <Button onClick={saveQuery} className="bg-[#10B981] hover:bg-[#059669] text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

