
import React, { useState } from 'react';
import { useSecurity } from '@/hooks/useSecurity';
import { SecurityAssessment } from "./SecurityAssessment";
import { ScanForm } from './scanner/ScanForm';
import { ScanError } from './scanner/ScanError';
import { ScanProgress } from './scanner/ScanProgress';

const HeaderScanner = () => {
  const [url, setUrl] = useState('');
  const { loading, results, errorDetails, scanUrl, logs } = useSecurity();

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent, requireAuth: boolean) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    if (!url) return;
    await scanUrl(url, requireAuth);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">HTTP Security Scanner</h2>
      <p className="mb-4">Enter a URL to scan for security headers and HTTP methods</p>
      
      <ScanForm
        url={url}
        setUrl={setUrl}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {logs.length > 0 && (
        <div className="mt-4 mb-2">
          <p className="text-sm text-slate-500">
            Below is the scan log showing all requests, responses, and any errors that occurred during the scan process.
          </p>
        </div>
      )}
      
      <ScanProgress logs={logs} />
      
      <ScanError errorDetails={errorDetails || ''} />

      {results && <SecurityAssessment results={results} />}
    </div>
  );
};

export { HeaderScanner };
