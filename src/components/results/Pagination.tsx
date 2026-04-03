import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRows: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalRows,
  rowsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, totalRows);

  const btn = "flex items-center justify-center w-7 h-7 rounded-md text-xs transition-colors";
  const enabled = "text-studio-muted hover:text-studio-text hover:bg-studio-hover";
  const disabled = "text-studio-muted/30 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between h-9 shrink-0 px-4 border-t border-studio-border text-2xs text-studio-muted">
      <span>
        {start}–{end} of {totalRows}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className={cn(btn, page === 0 ? disabled : enabled)}
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className={cn(btn, page === 0 ? disabled : enabled)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-3 text-xs text-studio-text">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className={cn(btn, page >= totalPages - 1 ? disabled : enabled)}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className={cn(btn, page >= totalPages - 1 ? disabled : enabled)}
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
