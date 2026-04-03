import { Play, Save, Loader2 } from "lucide-react";
import { useResultsStore } from "@/stores/results";

interface EditorToolbarProps {
  onExecute: () => void;
  onSave: () => void;
}

export function EditorToolbar({ onExecute, onSave }: EditorToolbarProps) {
  const isExecuting = useResultsStore((s) => s.isExecuting);

  return (
    <div className="flex items-center gap-3 h-11 shrink-0 px-4 bg-studio-surface border-b border-studio-border">
      <button
        onClick={onExecute}
        disabled={isExecuting}
        className="flex items-center gap-2 px-5 py-1.5 bg-studio-accent text-black rounded-md text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        Run
      </button>

      <button
        onClick={onSave}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-md transition-colors"
      >
        <Save className="w-4 h-4" />
        Save
      </button>

      <div className="ml-auto flex items-center gap-4 text-2xs text-studio-muted/50 font-mono">
        <span>⌘+Enter run</span>
        <span>⌘+S save</span>
      </div>
    </div>
  );
}
