import { Copy, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "@/types";

interface AIChatMessageProps {
  message: ChatMessage;
  onInsertSQL?: (sql: string) => void;
}

function extractCodeBlocks(text: string): { type: "text" | "code"; content: string }[] {
  const parts: { type: "text" | "code"; content: string }[] = [];
  const regex = /```(?:sql)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "code", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

export function AIChatMessage({ message, onInsertSQL }: AIChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] px-3 py-2 bg-studio-active rounded-lg text-xs leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const parts = extractCodeBlocks(message.content);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[90%]">
        {parts.map((part, i) =>
          part.type === "text" ? (
            <p
              key={i}
              className="text-xs text-studio-text whitespace-pre-wrap leading-relaxed py-0.5"
            >
              {part.content}
            </p>
          ) : (
            <div
              key={i}
              className="my-2 rounded-md bg-studio-bg border border-studio-border overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-studio-surface border-b border-studio-border">
                <span className="text-2xs text-studio-muted uppercase tracking-wide">SQL</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyCode(part.content)}
                    className="p-1 text-studio-muted hover:text-studio-text transition-colors rounded-md hover:bg-studio-hover"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {onInsertSQL && (
                    <button
                      onClick={() => onInsertSQL(part.content)}
                      className="p-1 text-studio-muted hover:text-studio-accent transition-colors rounded-md hover:bg-studio-hover"
                      title="Insert into editor"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <pre className="px-3 py-2.5 text-xs font-mono text-studio-text overflow-x-auto leading-relaxed">
                {part.content}
              </pre>
              {copied && (
                <div className="px-3 py-1 text-2xs text-studio-accent border-t border-studio-border">
                  Copied!
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
