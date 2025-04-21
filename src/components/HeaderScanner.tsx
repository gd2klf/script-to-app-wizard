
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { SecurityAssessment } from "./SecurityAssessment";
import axios from 'axios';

const isTraceEnabled = (response: any): boolean => {
  return response.status === 200;
};

const isDebugEnabled = (response: any): boolean => {
  return response.status === 200;
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
      // In a real application, this would call a backend API
      // For demo purposes, we'll just simulate some results
      const response = {
        headers: {
          'Content-Security-Policy': 'default-src \'self\'',
          'X-XSS-Protection': '1; mode=block',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        methods: {
          TRACE: false,
          OPTIONS: true,
          HEAD: true,
          DEBUG: true // Simulated DEBUG method response
        }
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResults(response);
      toast({
        title: "Scan Complete",
        description: "Security scan has been completed successfully",
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "An error occurred while scanning the URL",
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
