
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { addLog, resetLogs, setLogSetter, logHeaders, LogEntry } from "./security/useLog";
import { makeRequestWithRetry } from "./security/useRequestWithRetry";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  setLogSetter(setLogs);

  const scanUrl = async (url: string, requireAuth: boolean = false) => {
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    // Prevent authenticated scan if user is not logged in
    if (requireAuth && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to perform an authenticated scan",
        variant: "destructive",
      });
      return;
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
      
      if (requireAuth && user) {
        addLog('request', '  Authorization: Bearer [token]');
        addLog('request', '  User authenticated: Yes');
      } else {
        addLog('request', '  User authenticated: No');
      }

      // Make just one request for both headers and method check
      const response = await makeRequestWithRetry(processedUrl, 'GET', requireAuth);

      addLog('response', '=== RESPONSE ===');
      addLog('response', `Status: ${response.status} ${response.statusText}`);
      addLog('response', 'Headers:');
      logHeaders(response.headers, '  ');

      const headersPlain: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        headersPlain[key] = value?.toString() || '';
      });

      // Use the same response to determine if GET method is allowed
      // GET method is always allowed if we got a response
      const methodResults: Record<string, boolean> = {
        'GET': true
      };

      const securityResult: SecurityResult = {
        headers: headersPlain,
        methods: methodResults
      };

      setResults(securityResult);
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
