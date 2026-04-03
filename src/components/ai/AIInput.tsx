import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface AIInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function AIInput({ onSend, disabled }: AIInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 shrink-0 border-t border-studio-border">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about SQL..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-studio-bg border border-studio-border rounded-md px-3 py-2 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:border-studio-accent resize-none transition-colors disabled:opacity-50"
        style={{ minHeight: 38, maxHeight: 120 }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-studio-accent text-black hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
