
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { SecurityAssessment } from "./SecurityAssessment";
import axios from 'axios';

const checkMethod = async (url: string, method: string): Promise<boolean> => {
  try {
    await axios({ 
      url, 
      method: method as any,
      timeout: 5000
    });
    return true;
  } catch (error: any) {
    // If we get a 405 Method Not Allowed, the method is disabled
    // Any other error (like CORS) we assume the method is enabled
    return error.response?.status !== 405;
  }
};

const HeaderScanner = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to scan",
        variant: "destructive",
      });
      return;
    }

    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    setLoading(true);
    setResults(null);
    
    try {
      // First get the headers
      const headersResponse = await axios.get(processedUrl);
      const headers = headersResponse.headers;

      // Check different HTTP methods
      const methodsToCheck = ['TRACE', 'OPTIONS', 'HEAD', 'DEBUG'];
      const methodResults: Record<string, boolean> = {};

      await Promise.all(
        methodsToCheck.map(async (method) => {
          methodResults[method] = await checkMethod(processedUrl, method);
        })
      );

      const response = {
        headers,
        methods: methodResults
      };
      
      setResults(response);
      toast({
        title: "Scan Complete",
        description: "Security scan has been completed successfully",
      });
    } catch (error: any) {
      const errorMessage = error.response?.status === 403 
        ? "Access forbidden. The website might be blocking our requests."
        : "An error occurred while scanning the URL. The website might have CORS restrictions.";
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Scan error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">HTTP Security Scanner</h2>
      <p className="mb-4">Enter a URL to scan for security headers and HTTP methods</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Scanning...' : 'Scan Website'}
          </Button>
        </div>
      </form>
      
      <Alert className="mt-4 bg-amber-50 border-amber-200">
        <AlertDescription>
          Note: Due to CORS restrictions, this application can only scan websites that have proper CORS headers 
          set up to allow cross-origin requests. For production use, connect this UI to a backend proxy service.
        </AlertDescription>
      </Alert>

      {results && <SecurityAssessment results={results} />}
    </div>
  );
};

export { HeaderScanner };

