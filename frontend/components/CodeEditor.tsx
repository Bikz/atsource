"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-[500px] w-full">
      {mounted && (
        <MonacoEditor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={value}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
          }}
          theme="vs-dark"
        />
      )}
    </div>
  );
} 