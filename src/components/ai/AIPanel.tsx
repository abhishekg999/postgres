import { useEffect, useRef } from "react";
import { useAIStore } from "@/stores/ai";
import { useEditorStore } from "@/stores/editor";
import { AIChatMessage } from "./AIChatMessage";
import { AIInput } from "./AIInput";
import { ModelLoadingBar } from "./ModelLoadingBar";
import { AI_MODELS } from "@/config/models";
import { Sparkles, X, Trash2 } from "lucide-react";

interface AIPanelProps {
  onClose: () => void;
}

export function AIPanel({ onClose }: AIPanelProps) {
  const { status, messages, isGenerating, modelId, initialize, sendMessage, clearChat, setModel } =
    useAIStore();
  const { updateSQL, activeTabId } = useEditorStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInsertSQL = (sql: string) => {
    updateSQL(activeTabId, sql);
  };

  const isLoading = status === "downloading" || status === "loading";

  return (
    <div className="flex flex-col h-full w-80 shrink-0 bg-studio-surface border-l border-studio-border">
      {/* Header */}
      <div className="flex items-center justify-between h-11 shrink-0 px-4 border-b border-studio-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-studio-accent" />
          <span className="text-sm font-medium">AI Assistant</span>
          <span
            className={`w-2 h-2 rounded-full ${
              status === "ready"
                ? "bg-studio-accent"
                : status === "error"
                  ? "bg-studio-red"
                  : isLoading
                    ? "bg-studio-yellow animate-pulse"
                    : "bg-studio-muted"
            }`}
          />
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-studio-muted hover:text-studio-text transition-colors rounded-md hover:bg-studio-hover"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-studio-muted hover:text-studio-text transition-colors rounded-md hover:bg-studio-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Idle: model selector */}
      {status === "idle" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
          <Sparkles className="w-10 h-10 text-studio-muted/20" />
          <p className="text-xs text-studio-muted text-center leading-relaxed">
            Load an AI model to get SQL assistance powered by WebLLM
          </p>
          <select
            value={modelId}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-studio-bg border border-studio-border rounded-md px-3 py-2 text-xs text-studio-text focus:outline-none focus:border-studio-accent"
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.size})
              </option>
            ))}
          </select>
          <button
            onClick={initialize}
            className="w-full px-4 py-2.5 bg-studio-accent text-black rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Load Model
          </button>
          <p className="text-2xs text-studio-muted/50 text-center">
            Requires WebGPU. Runs entirely in your browser.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-studio-muted border-t-studio-accent" />
          <p className="text-sm text-studio-muted">Loading model...</p>
          <div className="w-full">
            <ModelLoadingBar />
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
          <p className="text-xs text-studio-red text-center">
            Failed to load model. Make sure your browser supports WebGPU.
          </p>
          <button
            onClick={initialize}
            className="px-4 py-2 bg-studio-accent text-black rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chat */}
      {status === "ready" && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-studio-muted">
                <Sparkles className="w-8 h-8 text-studio-muted/20" />
                <p className="text-xs text-center">Ask me to help write SQL queries</p>
                <div className="flex flex-col gap-2 mt-2 w-full">
                  {["Show all users", "Count orders by status", "Join users and orders"].map(
                    (q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="px-3 py-2 text-xs border border-studio-border rounded-md hover:bg-studio-hover transition-colors text-left text-studio-text"
                      >
                        {q}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              messages
                .filter((m) => m.role !== "system")
                .map((msg, i) => (
                  <AIChatMessage key={i} message={msg} onInsertSQL={handleInsertSQL} />
                ))
            )}
            {isGenerating && messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-2 px-1 text-xs text-studio-muted">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-studio-muted border-t-studio-accent" />
                Thinking...
              </div>
            )}
          </div>
          <AIInput onSend={sendMessage} disabled={isGenerating} />
        </>
      )}
    </div>
  );
}
