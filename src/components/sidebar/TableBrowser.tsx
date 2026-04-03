import { useState } from "react";
import { useDatabaseStore } from "@/stores/database";
import { useEditorStore } from "@/stores/editor";
import { Search } from "lucide-react";
import { TableItem } from "./TableItem";

export function TableBrowser() {
  const tables = useDatabaseStore((s) => s.tables);
  const [search, setSearch] = useState("");
  const { updateSQL, activeTabId } = useEditorStore();

  const filtered = search
    ? tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tables;

  const handleTableClick = (tableName: string) => {
    updateSQL(activeTabId, `SELECT * FROM ${tableName} LIMIT 100;`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-studio-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            className="block w-full bg-studio-bg border border-studio-border rounded-md pl-9 pr-3 py-2 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:border-studio-accent transition-colors"
          />
        </div>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        {filtered.length === 0 ? (
          <div className="text-center text-xs text-studio-muted py-8">
            {search ? "No tables found" : "No tables"}
          </div>
        ) : (
          filtered.map((table) => (
            <TableItem key={table.name} table={table} onSelect={handleTableClick} />
          ))
        )}
      </div>

      <div className="px-4 py-2 shrink-0 border-t border-studio-border">
        <span className="text-2xs text-studio-muted">
          {tables.length} table{tables.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
