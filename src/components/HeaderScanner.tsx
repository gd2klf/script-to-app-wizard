
import React, { useState } from 'react';
import { useSecurity } from '@/hooks/useSecurity';
import { SecurityAssessment } from "./SecurityAssessment";
import { ScanForm } from './scanner/ScanForm';
import { ScanError } from './scanner/ScanError';

const HeaderScanner = () => {
  const [url, setUrl] = useState('');
  const [useProxy, setUseProxy] = useState(true);
  const [selectedProxy, setSelectedProxy] = useState<string>('corsproxy.io');
  const { loading, results, errorDetails, scanUrl } = useSecurity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    await scanUrl(url, useProxy, selectedProxy as any);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">HTTP Security Scanner</h2>
      <p className="mb-4">Enter a URL to scan for security headers and HTTP methods</p>
      
      <ScanForm
        url={url}
        setUrl={setUrl}
        useProxy={useProxy}
        setUseProxy={setUseProxy}
        selectedProxy={selectedProxy}
        setSelectedProxy={setSelectedProxy}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <ScanError errorDetails={errorDetails || ''} />

      {results && <SecurityAssessment results={results} />}
    </div>
  );
};

export { HeaderScanner };
