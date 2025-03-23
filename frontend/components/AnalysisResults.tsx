"use client";

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Vulnerability {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  fix: string;
  line_numbers: number[];
}

interface Analysis {
  analysis: {
    vulnerabilities: Vulnerability[];
    overall_security_score: number;
    summary: string;
  };
  signature: string;
  timestamp: string;
  code_hash: string;
  meta: {
    code_length: number;
    language: string;
    model_used: string;
  };
}

export default function AnalysisResults({ analysis }: { analysis: Analysis | null }) {
  const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'summary' | 'verification'>('vulnerabilities');

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>No analysis results yet. Submit your code to see the analysis.</p>
      </div>
    );
  }

  const renderSeverityBadge = (severity: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${colors[severity as keyof typeof colors]}`}>
        {severity}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const shortenSignature = (signature: string) => {
    return signature.length > 20 ? `${signature.substring(0, 10)}...${signature.substring(signature.length - 10)}` : signature;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'vulnerabilities' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('vulnerabilities')}
        >
          Vulnerabilities
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'verification' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('verification')}
        >
          Verification
        </button>
      </div>

      <div className="flex-grow overflow-auto">
        {activeTab === 'vulnerabilities' && (
          <div>
            <div className="mb-4 flex items-center">
              <span className="mr-2">Security Score:</span>
              <span className={`text-xl font-bold ${getScoreColor(analysis.analysis.overall_security_score)}`}>
                {analysis.analysis.overall_security_score}/10
              </span>
            </div>
            
            {analysis.analysis.vulnerabilities.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
                No vulnerabilities detected! Your code looks secure.
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.analysis.vulnerabilities.map((vuln, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{vuln.type}</h3>
                      {renderSeverityBadge(vuln.severity)}
                    </div>
                    <p className="text-gray-700 mb-2">{vuln.description}</p>
                    <div className="mb-2">
                      <span className="text-sm font-medium">Line{vuln.line_numbers.length > 1 ? 's' : ''}:</span>{' '}
                      <span className="text-gray-700">{vuln.line_numbers.join(', ')}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Recommended Fix:</h4>
                      <div className="bg-gray-50 rounded-md overflow-hidden">
                        <SyntaxHighlighter
                          language={analysis.meta.language}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, fontSize: '12px' }}
                        >
                          {vuln.fix}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            <p className="text-gray-700 whitespace-pre-line">{analysis.analysis.summary}</p>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-lg mb-2">Analysis Metadata</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><span className="font-medium">Language:</span> {analysis.meta.language}</li>
                <li><span className="font-medium">Code Length:</span> {analysis.meta.code_length} characters</li>
                <li><span className="font-medium">Analysis Time:</span> {new Date(analysis.timestamp).toLocaleString()}</li>
                <li><span className="font-medium">Model:</span> {analysis.meta.model_used}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-lg mb-2 text-blue-800">Verification Information</h3>
              <p className="text-gray-700 mb-4">
                This analysis was performed inside a Trusted Execution Environment (TEE) 
                using SecretLLM on Nillion's infrastructure.
                The cryptographic signature below verifies the authenticity of this analysis.
              </p>
              
              <div className="mb-2">
                <span className="text-sm font-medium">Signature:</span>
                <div className="mt-1 p-2 bg-gray-100 rounded-md text-xs font-mono break-all">
                  {analysis.signature}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium">Code Hash:</span>
                <div className="mt-1 p-2 bg-gray-100 rounded-md text-xs font-mono break-all">
                  {analysis.code_hash}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 