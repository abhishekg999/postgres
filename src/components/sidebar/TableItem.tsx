import { useState } from "react";
import { ChevronRight, Table2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TableInfo } from "@/types";

interface TableItemProps {
  table: TableInfo;
  onSelect: (tableName: string) => void;
}

export function TableItem({ table, onSelect }: TableItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setExpanded(!expanded)}
        onDoubleClick={() => onSelect(table.name)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-studio-hover transition-colors group"
      >
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 text-studio-muted transition-transform shrink-0",
            expanded && "rotate-90",
          )}
        />
        <Table2 className="w-3.5 h-3.5 text-studio-muted shrink-0" />
        <span className="font-mono text-studio-text truncate">{table.name}</span>
        <span className="ml-auto text-2xs text-studio-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {table.columns.length}
        </span>
      </button>

      {expanded && (
        <div className="ml-7 pl-3 border-l border-studio-border/50 my-1">
          {table.columns.map((col) => (
            <div key={col.name} className="flex items-center gap-2 px-2 py-1 text-2xs">
              <span className="font-mono text-studio-text">{col.name}</span>
              <span className="font-mono text-studio-muted">{col.type}</span>
              {!col.nullable && <span className="text-studio-yellow font-medium">NN</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
