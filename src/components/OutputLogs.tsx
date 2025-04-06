import { QueryLog } from "@/types/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Terminal } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

interface QueryLogProps {
  queryLogs: QueryLog[];
  setQueryLogs: (logs: QueryLog[]) => void;
}
export function OutputLogs({ queryLogs, setQueryLogs }: QueryLogProps) {
  return (
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
      <ScrollArea className="h-32 overflow-auto">
        <div className="p-2 space-y-1">
          {queryLogs.length === 0 ? (
            <p className="text-xs text-[#A0AEC0] p-2">
              No logs yet. Execute a query to see output.
            </p>
          ) : (
            queryLogs.map((log, index) => (
              <div
                key={index}
                className="text-xs p-2 rounded bg-[#1E293B] border border-[#2D3748]"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      log.status === "success" ? "default" : "destructive"
                    }
                    className={
                      log.status === "success" ? "bg-[#10B981]" : "bg-[#EF4444]"
                    }
                  >
                    {log.status === "success" ? "SUCCESS" : "ERROR"}
                  </Badge>
                  <span className="text-[#A0AEC0]">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-[#E2E8F0]">{log.message}</p>
                {log.duration && (
                  <p className="mt-1 text-[#A0AEC0]">
                    Execution time: {log.duration}ms
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
