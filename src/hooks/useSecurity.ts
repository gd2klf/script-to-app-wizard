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

const MAX_RETRIES = 1;

const checkMethod = async (url: string, method: string, retryCount = 0): Promise<{ allowed: boolean; error?: string }> => {
  try {
    addLog('request', `Testing ${method} method...`);
    
    const { data, error } = await supabase.functions.invoke('security-scanner', {
      body: { url, method }
    });
    
    if (error) {
      console.error(`Error checking method ${method}:`, error);
      return { allowed: false, error: error.message };
    }
    
    // If data contains an error property and it's a timeout, retry if possible
    if (data.error && data.isTimeout && retryCount < MAX_RETRIES) {
      addLog('request', `Request timed out, retrying ${method} method...`);
      return checkMethod(url, method, retryCount + 1);
    }
    
    // If data contains an error property, something went wrong
    if (data.error) {
      console.error(`Error checking method ${method}:`, data.message);
      return { allowed: false, error: data.message };
    }
    
    // If response status is not 405 Method Not Allowed, the method is considered allowed
    // 200, 204, 301, 302, etc. are signs that the method might be allowed
    return { allowed: data.status !== 405 };
  } catch (error: any) {
    console.error(`Error checking method ${method}:`, error);
    return { allowed: false, error: error.message };
  }
};

// Create a module-level variable to store logs so they're accessible to the checkMethod function
let globalLogs: LogEntry[] = [];
let setGlobalLogs: React.Dispatch<React.SetStateAction<LogEntry[]>> | null = null;

const addLog = (type: 'request' | 'response' | 'error', message: string) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const newLog = { timestamp, type, message };
  
  // Update the global logs array
  globalLogs = [...globalLogs, newLog];
  
  // If setGlobalLogs is set, update the state as well
  if (setGlobalLogs) {
    setGlobalLogs(prev => [...prev, newLog]);
  }
};

export const useSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SecurityResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  // Set the global setter
  setGlobalLogs = setLogs;

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
    
    // Reset logs and global logs
    globalLogs = [];
    setLogs([]);
    
    try {
      addLog('request', `Initiating scan for: ${processedUrl}`);
      addLog('request', 'Using Supabase Edge Function');
      
      // Log the complete request information
      addLog('request', '=== REQUEST ===');
      addLog('request', `URL: ${processedUrl}`);
      addLog('request', 'Method: GET');
      addLog('request', 'Headers:');
      addLog('request', '  User-Agent: Security-Scanner/1.0');
      
      // Make the initial request through our edge function
      const { data: headersResponse, error } = await supabase.functions.invoke('security-scanner', {
        body: { url: processedUrl }
      });

      if (error) throw error;

      // Check if the response is a timeout and we should retry
      if (headersResponse.error && headersResponse.isTimeout) {
        addLog('request', 'Initial request timed out, retrying...');
        const { data: retryResponse, error: retryError } = await supabase.functions.invoke('security-scanner', {
          body: { url: processedUrl }
        });
        
        if (retryError) throw retryError;
        if (retryResponse.error) throw new Error(retryResponse.message);
        
        headersResponse = retryResponse;
      }
      
      // Check if headersResponse contains an error from the edge function
      if (headersResponse.error) {
        throw new Error(headersResponse.message || 'Error occurred in edge function');
      }
      
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
      const methodErrors: Record<string, string> = {};

      const methodChecks = await Promise.all(
        methodsToCheck.map(async (method) => {
          const result = await checkMethod(processedUrl, method);
          methodResults[method] = result.allowed;
          if (result.error) {
            methodErrors[method] = result.error;
            addLog('error', `Error checking ${method} method: ${result.error}`);
          } else {
            addLog('response', `${method} method: ${result.allowed ? 'ALLOWED (potentially unsafe)' : 'NOT ALLOWED (secure)'}`);
          }
          return { method, ...result };
        })
      );

      // Log any method testing errors, but continue with the results we have
      methodChecks.forEach(check => {
        if (check.error) {
          console.warn(`Warning for ${check.method} method: ${check.error}`);
        }
      });

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
      addLog('error', `Scan failed: ${errorDetail}`);
      
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
