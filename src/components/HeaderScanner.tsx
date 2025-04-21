import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityHeaders {
  [key: string]: string | null;
}

interface MethodTestResult {
  method: string;
  enabled: boolean;
  statusCode: number | null;
}

interface ScanResults {
  headers: SecurityHeaders;
  methodTests: MethodTestResult[];
  url: string;
}

const SECURITY_HEADERS = [
  {
    name: "Strict-Transport-Security",
    description: "Enforces HTTPS connections"
  },
  {
    name: "Content-Security-Policy",
    description: "Controls resources the browser is allowed to load"
  },
  {
    name: "X-Content-Type-Options",
    description: "Prevents MIME type sniffing"
  },
  {
    name: "X-Frame-Options",
    description: "Prevents clickjacking attacks"
  },
  {
    name: "X-XSS-Protection",
    description: "Enables browser's XSS filtering"
  },
  {
    name: "Referrer-Policy",
    description: "Controls referrer information"
  },
  {
    name: "Permissions-Policy",
    description: "Controls browser features"
  },
  {
    name: "Cache-Control",
    description: "Controls caching behavior"
  }
];

const HeaderScanner = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      setUrlError(null);
      return true;
    } catch (e) {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
      return false;
    }
  };

  const createProxyUrl = (targetUrl: string, method: string = 'GET') => {
    return `https://cors-anywhere.herokuapp.com/${targetUrl}`;
  };

  const isTraceEnabled = (response: any): boolean => {
    if (response.status >= 200 && response.status < 300) {
      return true;
    }
    
    const allow = response.headers['allow'];
    if (allow && allow.toUpperCase().includes('TRACE')) {
      return true;
    }

    if (response.data && typeof response.data === 'string') {
      if (response.data.includes('TRACE') && response.data.includes('HTTP')) {
        return true;
      }
    }

    const disabledStatusCodes = [
      405,
      501,
      403,
      401,
      404,
      400
    ];

    return !disabledStatusCodes.includes(response.status);
  };

  const scanHeaders = async () => {
    if (!validateUrl(url)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.get(createProxyUrl(url), {
        timeout: 10000,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      const methodTests: MethodTestResult[] = [];
      
      try {
        const debugResponse = await axios({
          method: 'debug',
          url: createProxyUrl(url, 'DEBUG'),
          timeout: 5000,
          validateStatus: () => true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        
        methodTests.push({
          method: 'DEBUG',
          enabled: debugResponse.status !== 405,
          statusCode: debugResponse.status
        });
      } catch (e) {
        methodTests.push({
          method: 'DEBUG',
          enabled: false,
          statusCode: null
        });
      }

      try {
        const traceResponse = await axios({
          method: 'trace',
          url: createProxyUrl(url, 'TRACE'),
          timeout: 5000,
          validateStatus: () => true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        
        methodTests.push({
          method: 'TRACE',
          enabled: isTraceEnabled(traceResponse),
          statusCode: traceResponse.status
        });
      } catch (e) {
        methodTests.push({
          method: 'TRACE',
          enabled: false,
          statusCode: null
        });
      }

      const headers: SecurityHeaders = {};
      SECURITY_HEADERS.forEach(header => {
        headers[header.name] = response.headers[header.name.toLowerCase()] || null;
      });

      setResults({ 
        headers, 
        methodTests,
        url 
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError("Request timed out. The server might be slow or unreachable.");
        } else if (err.response) {
          if (err.response.status === 403) {
            setError("Error: HTTP 403 - Forbidden. The CORS proxy (cors-anywhere) is likely blocking your request. You need to request temporary access to the demo server.");
            toast({
              title: "CORS Proxy Access Required",
              description: "You need to request temporary access to the cors-anywhere demo server.",
              variant: "destructive",
              action: (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open("https://cors-anywhere.herokuapp.com/corsdemo", "_blank")}
                >
                  Request Access
                </Button>
              ),
            });
          } else {
            setError(`Error: HTTP ${err.response.status} - ${err.response.statusText}`);
          }
        } else if (err.request) {
          setError("Error: No response received. The server might be down or the URL might be incorrect.");
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">HTTP Security Header Scanner</CardTitle>
          <CardDescription>
            Enter a URL to scan for security headers and test HTTP methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-col md:flex-row">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && scanHeaders()}
            />
            <Button 
              onClick={scanHeaders} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Scanning..." : "Scan Headers"}
            </Button>
          </div>
          {urlError && (
            <p className="text-sm text-destructive mt-2">{urlError}</p>
          )}
        </CardContent>
      </Card>

      <Alert className="mb-6" variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>About CORS Proxies</AlertTitle>
        <AlertDescription>
          This tool uses a CORS proxy to bypass browser security restrictions. If you get a 403 Forbidden error, you may need to 
          <Button 
            variant="link" 
            className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800" 
            onClick={() => window.open("https://cors-anywhere.herokuapp.com/corsdemo", "_blank")}
          >
            request temporary access
          </Button> to the demo server.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Security Headers</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {Object.values(results.headers).filter(Boolean).length}/{Object.keys(results.headers).length} Present
                </Badge>
              </CardTitle>
              <CardDescription>
                Analysis of security headers for {results.url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SECURITY_HEADERS.map((header) => {
                  const value = results.headers[header.name];
                  const isPresent = !!value;
                  
                  return (
                    <div key={header.name} className="border rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {isPresent ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <h3 className="font-medium">{header.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {header.description}
                          </p>
                        </div>
                        <Badge variant={isPresent ? "outline" : "destructive"} className={`${isPresent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {isPresent ? "Present" : "Missing"}
                        </Badge>
                      </div>
                      {value && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-mono break-all bg-slate-50 p-2 rounded-sm">{value}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HTTP Method Tests</CardTitle>
              <CardDescription>
                Testing if DEBUG and TRACE methods are enabled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.methodTests.map((test) => (
                  <div key={test.method} className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {test.enabled === false ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <h3 className="font-medium">{test.method}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.statusCode && (
                          <Badge variant="outline" className="text-xs">
                            Status: {test.statusCode}
                          </Badge>
                        )}
                        <Badge 
                          variant={test.enabled === false ? "outline" : "destructive"}
                          className={`${test.enabled === false ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {test.enabled === false ? "Disabled" : "Enabled"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {test.enabled === false 
                        ? `The ${test.method} method is properly disabled.` 
                        : `The ${test.method} method appears to be enabled, which can expose sensitive information.`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HeaderScanner;
