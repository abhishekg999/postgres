import { useState } from "react";
import { Search, Download, X } from "lucide-react";

interface ResultsToolbarProps {
  rowCount: number;
  onSearch: (query: string) => void;
  onExport: () => void;
}

export function ResultsToolbar({ rowCount, onSearch, onExport }: ResultsToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex items-center gap-3 h-10 shrink-0 px-3 bg-studio-surface border-b border-studio-border">
      <div className="relative flex-1 max-w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-studio-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Filter results..."
          className="block w-full bg-studio-bg border border-studio-border rounded-md pl-9 pr-8 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:border-studio-accent transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <span className="text-2xs text-studio-muted">
        {rowCount} row{rowCount !== 1 ? "s" : ""}
      </span>

      {rowCount > 0 && (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-2xs text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-md transition-colors ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      )}
    </div>
  );
}
