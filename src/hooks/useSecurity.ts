import { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

export type SecurityResult = {
  headers: Record<string, string>;
  methods: Record<string, boolean>;
};

type ProxyProvider = 'corsproxy.io' | 'cors-anywhere' | 'allorigins';

const ALTERNATIVE_PROXIES = {
  'corsproxy.io': 'https://corsproxy.io/?',
  'cors-anywhere': 'https://cors-anywhere.herokuapp.com/',
  'allorigins': 'https://api.allorigins.win/raw?url='
};

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  message: string;
}

const checkMethod = async (url: string, method: string, useProxy: boolean, proxyUrl: string): Promise<boolean> => {
  try {
    const finalUrl = useProxy ? `${proxyUrl}${encodeURIComponent(url)}` : url;
    await axios({ 
      url: finalUrl, 
      method: method as any,
      timeout: 5000
    });
    return true;
  } catch (error: any) {
    return error.response?.status !== 405;
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

  const scanUrl = async (
    url: string,
    useProxy: boolean,
    proxyProvider: ProxyProvider
  ) => {
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    setLoading(true);
    setResults(null);
    setErrorDetails(null);
    setLogs([]); // Clear previous logs
    
    try {
      const proxyUrl = ALTERNATIVE_PROXIES[proxyProvider];
      const finalUrl = useProxy ? `${proxyUrl}${encodeURIComponent(processedUrl)}` : processedUrl;
      
      addLog('request', `Initiating scan for: ${processedUrl}`);
      if (useProxy) {
        addLog('request', `Using proxy: ${proxyProvider}`);
      }
      
      addLog('request', `GET ${finalUrl}`);
      const headersResponse = await axios.get(finalUrl);
      addLog('response', `Received response with status: ${headersResponse.status}`);
      
      const headersPlain: Record<string, string> = {};
      const responseHeaders = headersResponse.headers;
      
      Object.entries(responseHeaders).forEach(([key, value]) => {
        headersPlain[key] = value?.toString() || '';
        addLog('response', `Header: ${key}: ${value}`);
      });

      const methodsToCheck = ['TRACE', 'OPTIONS', 'HEAD', 'DEBUG'];
      addLog('request', `Testing HTTP methods: ${methodsToCheck.join(', ')}`);
      
      const methodResults: Record<string, boolean> = {};

      await Promise.all(
        methodsToCheck.map(async (method) => {
          addLog('request', `Testing ${method} method`);
          methodResults[method] = await checkMethod(processedUrl, method, useProxy, proxyUrl);
          addLog('response', `${method} method ${methodResults[method] ? 'allowed' : 'not allowed'}`);
        })
      );

      const response: SecurityResult = {
        headers: headersPlain,
        methods: methodResults
      };
      
      setResults(response);
      addLog('response', 'Scan completed successfully');
      toast({
        title: "Scan Complete",
        description: "Security scan has been completed successfully",
      });
    } catch (error: any) {
      console.error("Scan error:", error);
      
      let errorMessage = "An error occurred while scanning the URL.";
      let errorDetail = "";
      
      if (error.response) {
        errorMessage = `Server responded with status: ${error.response.status}`;
        if (error.response.status === 403) {
          errorMessage = "Access forbidden. The website might be blocking our requests.";
        }
        errorDetail = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data || {})}`;
      } else if (error.request) {
        errorMessage = "No response received from the server.";
        errorDetail = "The request was made but the server didn't respond. This could be due to network issues, firewall blocks, or an unreachable host.";
      } else {
        errorMessage = `Error setting up request: ${error.message}`;
        errorDetail = error.message || "Unknown error occurred";
      }
      
      if (error.code === "ERR_NETWORK") {
        errorMessage = "Network error occurred. The URL might be unreachable or blocked.";
        errorDetail = "This could be due to network connectivity issues, a firewall blocking access, or the host being unreachable.";
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
