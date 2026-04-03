import { useState, useRef, useCallback } from "react";
import { CellValue } from "./CellValue";

interface DataGridProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

const MIN_COL_WIDTH = 100;
const DEFAULT_COL_WIDTH = 180;

export function DataGrid({ columns, rows }: DataGridProps) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const dragRef = useRef<{
    col: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const getWidth = useCallback(
    (col: string) => columnWidths[col] ?? DEFAULT_COL_WIDTH,
    [columnWidths],
  );

  const onMouseDown = useCallback(
    (col: string, e: React.MouseEvent) => {
      e.preventDefault();
      const startWidth = getWidth(col);
      dragRef.current = { col, startX: e.clientX, startWidth };

      const onMouseMove = (e: MouseEvent) => {
        if (!dragRef.current) return;
        const diff = e.clientX - dragRef.current.startX;
        const newWidth = Math.max(MIN_COL_WIDTH, dragRef.current.startWidth + diff);
        setColumnWidths((prev) => ({
          ...prev,
          [dragRef.current!.col]: newWidth,
        }));
      };

      const onMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [getWidth],
  );

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-studio-muted">
        No results to display
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="border-collapse text-xs font-mono">
        <thead className="sticky top-0 z-10">
          <tr className="bg-studio-surface">
            {columns.map((col) => (
              <th
                key={col}
                className="relative text-left px-4 py-2.5 text-2xs font-semibold text-studio-muted uppercase tracking-wider border-b border-r border-studio-border whitespace-nowrap"
                style={{
                  width: getWidth(col),
                  minWidth: MIN_COL_WIDTH,
                }}
              >
                {col}
                <div
                  onMouseDown={(e) => onMouseDown(col, e)}
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-studio-accent/50 transition-colors"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-studio-border/40 hover:bg-studio-hover/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis border-r border-studio-border/20"
                  style={{
                    width: getWidth(col),
                    maxWidth: getWidth(col),
                  }}
                >
                  <CellValue value={row[col]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
