"use client";

import { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import AnalysisResults from '../components/AnalysisResults';

export default function Home() {
  const [code, setCode] = useState<string>('// Paste your code here to verify it');
  const [language, setLanguage] = useState<string>('javascript');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
  };

  const verifyCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify code');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">ATSource</h1>
        <p className="text-lg text-gray-600">
          Secure Code Verification in a Trusted Execution Environment
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Code Input</h2>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="border border-gray-300 rounded-md p-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <div className="flex-grow border border-gray-300 rounded-lg overflow-hidden">
            <CodeEditor 
              value={code} 
              onChange={handleCodeChange} 
              language={language}
            />
          </div>
          <button
            onClick={verifyCode}
            disabled={isLoading || !code.trim()}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          <div className="flex-grow border border-gray-300 rounded-lg p-4 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <AnalysisResults analysis={analysis} />
            )}
          </div>
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500">
        <p>Powered by OpenAI & Marlin TEE</p>
      </footer>
    </div>
  );
} 