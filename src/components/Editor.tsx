"use client";

import { useDatabaseStore } from "@/store/database";
import * as monaco from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  onExecuteQuery?: (query: string) => void;
}

monaco.editor.defineTheme("sqlTheme", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "10B981", fontStyle: "bold" },
    { token: "operator", foreground: "A0AEC0" },
    { token: "string", foreground: "F59E0B" },
    { token: "number", foreground: "3B82F6" },
    { token: "comment", foreground: "6B7280", fontStyle: "italic" },
    { token: "identifier", foreground: "E2E8F0" },
  ],
  colors: {
    "editor.background": "#1A202C",
    "editor.foreground": "#E2E8F0",
    "editorCursor.foreground": "#10B981",
    "editor.lineHighlightBackground": "#2D3748",
    "editorLineNumber.foreground": "#6B7280",
    "editor.selectionBackground": "#374151",
    "editor.inactiveSelectionBackground": "#2D3748",
    "editorIndentGuide.background": "#2D3748",
  },
});

export default function Editor({
  value,
  onChange,
  language = "sql",
  readOnly = false,
  onExecuteQuery,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const editorInitializedRef = useRef(false);
  const { tableSchema, dbInitialized } = useDatabaseStore();

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange]
  );

  const executeQuery = useCallback(() => {
    if (
      dbInitialized &&
      onExecuteQuery &&
      !readOnly &&
      monacoEditorRef.current
    ) {
      onExecuteQuery(monacoEditorRef.current.getValue());
    }
  }, [onExecuteQuery, readOnly, dbInitialized]);

  useEffect(() => {
    if (!editorRef.current || editorInitializedRef.current) return;

    monacoEditorRef.current = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: "sqlTheme",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      tabSize: 2,
      readOnly,
      wordWrap: "on",
      lineNumbers: "on",
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
    });

    let content = value;
    monacoEditorRef.current.onDidChangeModelContent(() => {
      const newContent = monacoEditorRef.current?.getValue() || "";
      if (content !== newContent) {
        content = newContent;
        handleChange(content);
      }
    });

    monacoEditorRef.current.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      executeQuery
    );

    editorInitializedRef.current = true;

    return () => {
      editorInitializedRef.current = false;
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose();
        monacoEditorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (Object.keys(tableSchema).length === 0) return;

    const disposable = monaco.languages.registerCompletionItemProvider("sql", {
      triggerCharacters: [" ", "."],
      provideCompletionItems: (model, position) => {
        const wordInfo = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endColumn: wordInfo.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [];

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const tableNameDotMatch = textUntilPosition.match(/(\w+)\.\s*$/);
        if (tableNameDotMatch) {
          const tableName = tableNameDotMatch[1];
          if (tableSchema[tableName]) {
            return {
              suggestions: tableSchema[tableName].map((column) => ({
                label: column,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column,
                range,
              })),
            };
          }
        }

        const keywords = [
          "SELECT",
          "FROM",
          "WHERE",
          "JOIN",
          "LEFT JOIN",
          "RIGHT JOIN",
          "INNER JOIN",
          "GROUP BY",
          "ORDER BY",
          "HAVING",
          "LIMIT",
          "OFFSET",
          "INSERT INTO",
          "VALUES",
          "UPDATE",
          "SET",
          "DELETE FROM",
          "CREATE TABLE",
          "ALTER TABLE",
          "DROP TABLE",
        ];

        keywords.forEach((keyword) => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range,
          });
        });

        Object.keys(tableSchema).forEach((tableName) => {
          suggestions.push({
            label: tableName,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: tableName,
            range,
          });
        });

        return { suggestions };
      },
    });

    return () => disposable.dispose();
  }, [tableSchema]);

  useEffect(() => {
    const handleResize = () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.layout();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      monacoEditorRef.current &&
      monacoEditorRef.current.getValue() !== value
    ) {
      const position = monacoEditorRef.current.getPosition();

      monacoEditorRef.current.setValue(value);

      if (position) {
        monacoEditorRef.current.setPosition(position);
      }
    }
  }, [value]);

  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return <div ref={editorRef} className="h-full w-full relative" />;
}
