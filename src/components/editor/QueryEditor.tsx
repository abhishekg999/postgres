import { useEffect, useRef, useCallback } from "react";
import * as monaco from "monaco-editor";
import { monacoTheme, SQL_KEYWORDS } from "@/config/theme";
import { useEditorStore } from "@/stores/editor";
import { useDatabaseStore } from "@/stores/database";

interface QueryEditorProps {
  onExecute: () => void;
}

export function QueryEditor({ onExecute }: QueryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelsRef = useRef<Map<string, monaco.editor.ITextModel>>(new Map());

  const { tabs, activeTabId, updateSQL } = useEditorStore();
  const tables = useDatabaseStore((s) => s.tables);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const onExecuteRef = useRef(onExecute);
  onExecuteRef.current = onExecute;

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    monaco.editor.defineTheme("pgide", monacoTheme);

    const editor = monaco.editor.create(containerRef.current, {
      theme: "pgide",
      language: "sql",
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace",
      lineHeight: 20,
      padding: { top: 12 },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      tabSize: 2,
      renderLineHighlight: "line",
      cursorBlinking: "smooth",
      smoothScrolling: true,
      contextmenu: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
    });

    editorRef.current = editor;

    // Cmd+Enter to execute
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecuteRef.current();
    });

    return () => {
      editor.dispose();
      modelsRef.current.forEach((m) => m.dispose());
      modelsRef.current.clear();
    };
  }, []);

  // Sync tab content with editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !activeTab) return;

    let model = modelsRef.current.get(activeTab.id);
    if (!model) {
      model = monaco.editor.createModel(activeTab.sql, "sql");
      modelsRef.current.set(activeTab.id, model);

      model.onDidChangeContent(() => {
        updateSQL(activeTab.id, model!.getValue());
      });
    }

    if (editor.getModel() !== model) {
      editor.setModel(model);
    }
  }, [activeTabId, activeTab, updateSQL]);

  // Clean up models for closed tabs
  useEffect(() => {
    const tabIds = new Set(tabs.map((t) => t.id));
    modelsRef.current.forEach((model, id) => {
      if (!tabIds.has(id)) {
        model.dispose();
        modelsRef.current.delete(id);
      }
    });
  }, [tabs]);

  // Register SQL completions
  useEffect(() => {
    const disposable = monaco.languages.registerCompletionItemProvider("sql", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [];

        // SQL keywords
        for (const kw of SQL_KEYWORDS) {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          });
        }

        // Table names
        for (const table of tables) {
          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Struct,
            insertText: table.name,
            detail: `Table (${table.columns.length} columns)`,
            range,
          });

          // Column names
          for (const col of table.columns) {
            suggestions.push({
              label: `${table.name}.${col.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.name,
              detail: col.type,
              range,
            });
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.name,
              detail: `${table.name}.${col.type}`,
              range,
            });
          }
        }

        return { suggestions };
      },
    });

    return () => disposable.dispose();
  }, [tables]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// Helper to get the current SQL from the editor
export function useEditorSQL() {
  const getActiveTab = useEditorStore((s) => s.getActiveTab);
  return useCallback(() => {
    const tab = getActiveTab();
    return tab?.sql ?? "";
  }, [getActiveTab]);
}
