
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SecurityResult = {
  headers: Record<string, string>;
  methods: Record<string, boolean>;
};

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  message: string;
}

const checkMethod = async (url: string, method: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('security-scanner', {
      body: { url, method }
    });
    
    if (error) throw error;
    
    // If response status is not 405 Method Not Allowed, the method is considered allowed
    return data.status !== 405;
  } catch (error: any) {
    console.error(`Error checking method ${method}:`, error);
    return false;
  }
};

export const useSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SecurityResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  const addLog = (type: 'request' | 'response' | 'error', message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, { timestamp, type, message }]);
  };

  const logHeaders = (headers: Record<string, any>, prefix: string) => {
    Object.entries(headers).forEach(([key, value]) => {
      addLog('response', `${prefix}${key}: ${value}`);
    });
  };

  const scanUrl = async (url: string) => {
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    setLoading(true);
    setResults(null);
    setErrorDetails(null);
    setLogs([]); // Clear previous logs
    
    try {
      addLog('request', `Initiating scan for: ${processedUrl}`);
      addLog('request', 'Using Supabase Edge Function');
      
      // Log the complete request information
      addLog('request', '=== REQUEST ===');
      addLog('request', `URL: ${processedUrl}`);
      addLog('request', 'Method: GET');
      addLog('request', 'Headers:');
      addLog('request', '  User-Agent: Security-Scanner/1.0');
      
      // Make the request through our edge function
      const { data: headersResponse, error } = await supabase.functions.invoke('security-scanner', {
        body: { url: processedUrl }
      });
      
      if (error) throw error;
      
      // Log the complete response information
      addLog('response', '=== RESPONSE ===');
      addLog('response', `Status: ${headersResponse.status} ${headersResponse.statusText}`);
      addLog('response', 'Headers:');
      logHeaders(headersResponse.headers, '  ');
      
      const headersPlain: Record<string, string> = {};
      const responseHeaders = headersResponse.headers;
      
      Object.entries(responseHeaders).forEach(([key, value]) => {
        headersPlain[key] = value?.toString() || '';
      });

      const methodsToCheck = ['TRACE', 'OPTIONS', 'HEAD', 'DEBUG'];
      addLog('request', '\n=== TESTING HTTP METHODS ===');
      
      const methodResults: Record<string, boolean> = {};

      await Promise.all(
        methodsToCheck.map(async (method) => {
          addLog('request', `Testing ${method} method...`);
          methodResults[method] = await checkMethod(processedUrl, method);
          addLog('response', `${method} method: ${methodResults[method] ? 'ALLOWED (potentially unsafe)' : 'NOT ALLOWED (secure)'}`);
        })
      );

      const response: SecurityResult = {
        headers: headersPlain,
        methods: methodResults
      };
      
      setResults(response);
      addLog('response', '\n=== SCAN COMPLETED ===');
      toast({
        title: "Scan Complete",
        description: "Security scan has been completed successfully",
      });
    } catch (error: any) {
      console.error("Scan error:", error);
      
      let errorMessage = "An error occurred while scanning the URL.";
      let errorDetail = "";
      
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
        errorDetail = error.message;
      }
      
      setErrorDetails(errorDetail);
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    results,
    errorDetails,
    logs,
    scanUrl
  };
};
