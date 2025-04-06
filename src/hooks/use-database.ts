import { useToast } from "@/hooks/use-toast";
import { executeQuery, getTables, initDB, QueryResult } from "@/lib/db";
import { QueryLog } from "@/types/types";
import { PGlite } from "@electric-sql/pglite";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDatabase() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [tableSchema, setTableSchema] = useState<Record<string, string[]>>({});
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [results, setResults] = useState<QueryResult["rows"]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const dbRef = useRef<PGlite | null>(null);
  const { toast } = useToast();

  const refreshTables = useCallback(async () => {
    if (!dbRef.current) return;

    try {
      const tableList = await getTables(dbRef.current);
      setTables(Object.keys(tableList));
      setTableSchema(tableList);
    } catch (error) {
      console.error("Failed to refresh tables:", error);
    }
  }, []);

  useEffect(() => {
    const initializeDb = async () => {
      if (dbRef.current || isInitializing) return;

      setIsInitializing(true);

      try {
        const dbInstance = await initDB();
        dbRef.current = dbInstance;
        setDbInitialized(true);
        refreshTables();
      } catch (error) {
        console.error("Failed to initialize database:", error);
        toast({
          title: "Database connection failed",
          description: "Could not connect to the database",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDb();
  }, [refreshTables, toast, isInitializing]);

  const checkDbStatus = useCallback(() => {
    const isInitialized = dbRef.current !== null;
    setDbInitialized(isInitialized);
    return isInitialized;
  }, []);

  if (!dbRef.current) {
    return {
      dbInitialized: false,
      isInitializing,
      isExecuting: false,
      tables: [],
      tableSchema: {},
      queryLogs,
      results: [],
      columns: [],
      runQuery: async () => null,
      refreshTables: async () => {},
      setQueryLogs,
      checkDbStatus: () => false,
    };
  }

  const runQuery = async (query: string) => {
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a SQL query to execute",
        variant: "destructive",
      });
      return null;
    }

    setIsExecuting(true);

    try {
      const result = await executeQuery(dbRef.current!, query);

      const newLog = {
        message: result.message,
        status: result.status,
        timestamp: Date.now(),
        duration: result.duration,
      };
      setQueryLogs((prev) => [newLog, ...prev].slice(0, 50));

      if (Array.isArray(result.rows) && result.rows.length > 0) {
        setColumns(Object.keys(result.rows[0]));
        setResults(result.rows);
      } else {
        setColumns([]);
        setResults([]);
      }

      refreshTables();

      toast({
        title: result.status === "success" ? "Query executed" : "Query failed",
        description: result.message,
        variant: result.status === "success" ? "default" : "destructive",
      });

      return result;
    } catch (error) {
      console.error("Query execution error:", error);

      const newLog = {
        message:
          (error as Error).message ||
          "An error occurred during query execution",
        status: "error" as const,
        timestamp: Date.now(),
      };

      setQueryLogs((prev) => [newLog, ...prev].slice(0, 50));

      toast({
        title: "Query failed",
        description:
          (error as Error).message ||
          "An error occurred during query execution",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    dbInitialized,
    isInitializing,
    isExecuting,
    tables,
    tableSchema,
    queryLogs,
    results,
    columns,
    runQuery,
    refreshTables,
    setQueryLogs,
    checkDbStatus,
  };
}
