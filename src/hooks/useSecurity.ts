
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
  const { toast } = useToast();

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
    
    try {
      const proxyUrl = ALTERNATIVE_PROXIES[proxyProvider];
      const finalUrl = useProxy ? `${proxyUrl}${encodeURIComponent(processedUrl)}` : processedUrl;
      
      console.log(`Attempting to fetch: ${finalUrl}`);
      const headersResponse = await axios.get(finalUrl);
      
      // Convert Axios headers to a plain Record<string, string> object
      const headersPlain: Record<string, string> = {};
      const responseHeaders = headersResponse.headers;
      
      // Extract headers and ensure they're all strings
      Object.entries(responseHeaders).forEach(([key, value]) => {
        headersPlain[key] = value?.toString() || '';
      });

      const methodsToCheck = ['TRACE', 'OPTIONS', 'HEAD', 'DEBUG'];
      const methodResults: Record<string, boolean> = {};

      await Promise.all(
        methodsToCheck.map(async (method) => {
          methodResults[method] = await checkMethod(processedUrl, method, useProxy, proxyUrl);
        })
      );

      const response: SecurityResult = {
        headers: headersPlain,
        methods: methodResults
      };
      
      setResults(response);
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
    scanUrl
  };
};
