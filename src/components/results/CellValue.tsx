interface CellValueProps {
  value: unknown;
}

export function CellValue({ value }: CellValueProps) {
  if (value === null || value === undefined) {
    return <span className="text-studio-muted italic">NULL</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-studio-accent" : "text-studio-red"}>{String(value)}</span>
    );
  }

  if (typeof value === "number") {
    return <span className="text-blue-400">{value}</span>;
  }

  if (typeof value === "object") {
    return <span className="text-amber-400">{JSON.stringify(value)}</span>;
  }

  return <span>{String(value)}</span>;
}
