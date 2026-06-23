"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language: string;
  theme?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  code,
  onChange,
  language,
  theme = "vs-dark",
}) => {
  const getMonacoLanguage = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "java":
        return "java";
      case "python":
      case "py":
        return "python";
      case "cpp":
      case "c++":
        return "cpp";
      case "go":
        return "go";
      case "javascript":
      case "js":
        return "javascript";
      default:
        return "python";
    }
  };

  return (
    <div className="w-full h-full monaco-editor-wrapper">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
        onChange={onChange}
        theme={theme}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
          fontFamily: "var(--font-geist-mono), Menlo, Monaco, Consolas, monospace",
        }}
      />
    </div>
  );
};
