import { useDatabase } from "@/hooks/use-database";
import { HistoryItem, SavedQuery } from "@/types/types";
import {
  Bookmark,
  ChevronDown,
  Clock,
  Database,
  TableIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SidebarProps {
  tables: string[];
  savedQueries: SavedQuery[] | undefined;
  queryHistory: HistoryItem[] | undefined;
  setQuery: (query: string) => void;
  loadQuery: (savedQuery: SavedQuery) => void;
  deleteQuery: (id: string) => void;
  loadHistoryQuery: (historyItem: HistoryItem) => void;
  openSaveDialog: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({
  tables,
  savedQueries,
  queryHistory,
  setQuery,
  loadQuery,
  deleteQuery,
  loadHistoryQuery,
  openSaveDialog,
  isCollapsed,
  toggleSidebar,
}: SidebarProps) {
  const { dbInitialized, isInitializing, runQuery } = useDatabase();

  const handleSelectTable = (table: string) => {
    setQuery(`SELECT * FROM ${table} LIMIT 100`);
    runQuery(table);
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-full border-r border-[#2D3748] bg-[#1A202C] flex flex-col transition-all duration-300 relative`}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#2D3748]">
        {!isCollapsed && (
          <div className="text-sm font-semibold text-[#E2E8F0]">
            <Database
              className={`h-5 w-5 ${
                dbInitialized ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            />
            <h1 className="text-xl font-bold text-white">Postgres Editor</h1>
            {isInitializing && (
              <span className="text-xs text-[#A0AEC0] ml-2 animate-pulse">
                Initializing...
              </span>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-7 w-7 ml-auto text-[#A0AEC0] hover:text-[#E2E8F0] hover:bg-[#2D3748]"
        >
          <ChevronDown
            className={`h-4 w-4 transform transition-transform duration-200 ${
              isCollapsed ? "rotate-90" : "-rotate-90"
            }`}
          />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="p-2">
            <div className="flex items-center text-[#A0AEC0] h-8 px-2 text-xs font-medium">
              <Database className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Database</span>
            </div>
            <div className="mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-[#E2E8F0] hover:bg-[#2D3748] h-8 px-2"
                  >
                    <span className="truncate">Tables</span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-[#1A202C] border-[#2D3748] z-50"
                >
                  {tables.map((table) => (
                    <DropdownMenuItem
                      key={table}
                      onClick={() => handleSelectTable(table)}
                      className="text-[#E2E8F0] focus:bg-[#2D3748] focus:text-white"
                    >
                      <TableIcon className="h-4 w-4 mr-2 text-[#10B981] flex-shrink-0" />
                      <span className="truncate">{table}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="bg-[#2D3748] my-2" />

          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="saved" className="flex-1 flex flex-col">
              <div className="px-2">
                <TabsList className="grid grid-cols-2 mb-2 bg-[#2D3748]">
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
              </div>

              <TabsContent value="saved" className="flex-1 mt-0">
                <ScrollArea className="h-[calc(100vh-230px)]">
                  <div className="space-y-2 px-2">
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[#A0AEC0] hover:text-white hover:bg-[#374151] flex-shrink-0"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                  </svg>
                                  <span className="sr-only">Menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-[#1A202C] border-[#2D3748] z-50"
                              >
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

              <TabsContent value="history" className="flex-1 mt-0">
                <ScrollArea className="h-[calc(100vh-230px)]">
                  <div className="space-y-2 px-2">
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

          <div className="p-2 mt-auto border-t border-[#2D3748]">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[#E2E8F0] border-[#2D3748] hover:bg-[#2D3748] hover:text-white"
              onClick={openSaveDialog}
            >
              <Bookmark className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Save Query</span>
            </Button>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#A0AEC0] hover:text-[#E2E8F0] hover:bg-[#2D3748]"
            title="Database"
          >
            <Database className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#A0AEC0] hover:text-[#E2E8F0] hover:bg-[#2D3748]"
            title="Saved Queries"
          >
            <Bookmark className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#A0AEC0] hover:text-[#E2E8F0] hover:bg-[#2D3748]"
            title="Query History"
          >
            <Clock className="h-5 w-5" />
          </Button>
          <div className="mt-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#A0AEC0] hover:text-[#E2E8F0] hover:bg-[#2D3748]"
              onClick={openSaveDialog}
              title="Save Query"
            >
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
