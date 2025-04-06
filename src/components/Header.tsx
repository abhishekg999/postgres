import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDatabase } from "@/hooks/use-database";
import { Play } from "lucide-react";
import { useEffect } from "react";
import { Button } from "./ui/button";

type HeaderProps = {
  query: string;
  onRunQuery: (query: string) => void;
};

export function Header({ query, onRunQuery }: HeaderProps) {
  const { dbInitialized, isExecuting, checkDbStatus } = useDatabase();

  useEffect(() => {
    checkDbStatus();
    const checkInterval = setInterval(() => {
      checkDbStatus();
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [checkDbStatus]);

  return (
    <header className="border-b border-[#2D3748] px-6 py-3 flex items-center justify-between bg-[#1A202C]">
      <div className="flex items-center gap-2"></div>
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={() => onRunQuery(query)}
                disabled={!dbInitialized || isExecuting || !query.trim()}
                className="bg-[#10B981] hover:bg-[#059669] text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Run
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!dbInitialized
                ? "Database not ready"
                : isExecuting
                ? "Query in progress"
                : !query.trim()
                ? "Enter a query first"
                : "Execute query"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
