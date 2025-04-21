
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SecurityAssessment } from "./SecurityAssessment";
import axios from 'axios';

const CORS_PROXY = 'https://corsproxy.io/?';
// Add alternative proxies
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
    // If we get a 405 Method Not Allowed, the method is disabled
    // Any other error (like CORS) we assume the method is enabled
    return error.response?.status !== 405;
  }
};

const HeaderScanner = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [useProxy, setUseProxy] = useState(true); // Set default to true
  const [selectedProxy, setSelectedProxy] = useState<string>('corsproxy.io');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
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
    setErrorDetails(null);
    
    try {
      // First get the headers
      const proxyUrl = ALTERNATIVE_PROXIES[selectedProxy as keyof typeof ALTERNATIVE_PROXIES];
      const finalUrl = useProxy ? `${proxyUrl}${encodeURIComponent(processedUrl)}` : processedUrl;
      
      console.log(`Attempting to fetch: ${finalUrl}`);
      const headersResponse = await axios.get(finalUrl);
      const headers = headersResponse.headers;

      // Check different HTTP methods
      const methodsToCheck = ['TRACE', 'OPTIONS', 'HEAD', 'DEBUG'];
      const methodResults: Record<string, boolean> = {};

      await Promise.all(
        methodsToCheck.map(async (method) => {
          methodResults[method] = await checkMethod(processedUrl, method, useProxy, proxyUrl);
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
      console.error("Scan error:", error);
      
      let errorMessage = "An error occurred while scanning the URL.";
      let errorDetail = "";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage = `Server responded with status: ${error.response.status}`;
        if (error.response.status === 403) {
          errorMessage = "Access forbidden. The website might be blocking our requests.";
        }
        errorDetail = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data || {})}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response received from the server.";
        errorDetail = "The request was made but the server didn't respond. This could be due to network issues, firewall blocks, or an unreachable host.";
      } else {
        // Something happened in setting up the request
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-proxy"
              checked={useProxy}
              onCheckedChange={setUseProxy}
            />
            <label htmlFor="use-proxy" className="text-sm text-gray-600">
              Use CORS proxy
            </label>
          </div>
          
          {useProxy && (
            <div className="flex items-center space-x-2">
              <select 
                value={selectedProxy} 
                onChange={(e) => setSelectedProxy(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Object.keys(ALTERNATIVE_PROXIES).map((proxy) => (
                  <option key={proxy} value={proxy}>
                    {proxy}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">Choose proxy provider</span>
            </div>
          )}
        </div>
      </form>
      
      <Alert className="mt-4 bg-amber-50 border-amber-200">
        <AlertDescription>
          If you encounter connection issues, try enabling a different proxy provider. Some websites might block specific proxies or have strict security measures.
        </AlertDescription>
      </Alert>

      {errorDetails && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            <div className="font-semibold">Diagnostic information:</div>
            <div className="mt-1 text-sm break-all">{errorDetails}</div>
            <div className="mt-2">
              <p>Troubleshooting tips:</p>
              <ul className="list-disc pl-5 text-sm mt-1">
                <li>Check if the URL is correct and accessible in your browser</li>
                <li>Try a different proxy provider</li>
                <li>Some websites may actively block security scanning attempts</li>
                <li>Internal or private URLs may not be accessible from this application</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {results && <SecurityAssessment results={results} />}
    </div>
  );
};

export { HeaderScanner };
