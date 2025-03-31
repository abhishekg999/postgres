"use client"

import { useEffect, useRef } from "react"
import * as monaco from "monaco-editor"

interface EditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
}

export default function Editor({ value, onChange, language = "sql", readOnly = false }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Define custom SQL theme
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
    })

    // Create editor with a slight delay to ensure container is ready
    const timer = setTimeout(() => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose()
      }

      monacoEditorRef.current = monaco.editor.create(editorRef.current!, {
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
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        cursorStyle: "line",
        cursorWidth: 2,
      })

      monacoEditorRef.current.onDidChangeModelContent(() => {
        onChange(monacoEditorRef.current?.getValue() || "")
      })

      // Force layout update
      monacoEditorRef.current.layout()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose()
      }
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.layout()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== value) {
      monacoEditorRef.current.setValue(value)
    }
  }, [value])

  // Update readOnly state
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.updateOptions({ readOnly })
    }
  }, [readOnly])

  return <div ref={editorRef} className="h-full w-full absolute inset-0" />
}

