
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { addLog, resetLogs, setLogSetter, logHeaders, LogEntry } from "./security/useLog";
import { makeRequestWithRetry } from "./security/useRequestWithRetry";
import { checkMethod } from "./security/useCheckMethod";

export type SecurityResult = {
  headers: Record<string, string>;
  methods: Record<string, boolean>;
};

export const useSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SecurityResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  setLogSetter(setLogs);

  const scanUrl = async (url: string) => {
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    setLoading(true);
    setResults(null);
    setErrorDetails(null);

    resetLogs();

    try {
      addLog('request', `Initiating scan for: ${processedUrl}`);
      addLog('request', 'Using Supabase Edge Function with 5-second timeout');
      addLog('request', '=== REQUEST ===');
      addLog('request', `URL: ${processedUrl}`);
      addLog('request', 'Method: GET');
      addLog('request', 'Headers:');
      addLog('request', '  User-Agent: Security-Scanner/1.0');

      const headersResponse = await makeRequestWithRetry(processedUrl);

      addLog('response', '=== RESPONSE ===');
      addLog('response', `Status: ${headersResponse.status} ${headersResponse.statusText}`);
      addLog('response', 'Headers:');
      logHeaders(headersResponse.headers, '  ');

      const headersPlain: Record<string, string> = {};
      Object.entries(headersResponse.headers).forEach(([key, value]) => {
        headersPlain[key] = value?.toString() || '';
      });

      // Only check GET method
      const methodResults: Record<string, boolean> = {};
      const result = await checkMethod(processedUrl, 'GET');
      methodResults['GET'] = result.allowed;
      
      if (result.error) {
        console.warn(`Warning for GET method: ${result.error}`);
      }

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
      let errorDetail = error?.message ? error.message : "";
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
