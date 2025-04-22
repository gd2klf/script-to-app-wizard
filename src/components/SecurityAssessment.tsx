
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeCsp } from "@/utils/security/analyzeCsp";
import { analyzeStrictTransportSecurity } from "@/utils/security/analyzeStrictTransportSecurity";
import { analyzeSetCookieHeader } from "@/utils/security/analyzeSetCookie";
import { analyzeXFrameOptions } from "@/utils/security/analyzeXFrame";

type SecurityResult = {
  headers: Record<string, string>;
  methods: Record<string, boolean>;
};

const importantHeaders = [
  "content-security-policy",
  "set-cookie",
  "strict-transport-security",
  "x-frame-options",
  "x-xss-protection",
  "x-content-type-options",
  "referrer-policy"
];

const getHeaderStatus = (header: string, value: string | undefined, allHeaders?: Record<string, string>) => {
  // Log the header value to help with debugging
  if (header.toLowerCase() === 'set-cookie' && value) {
    console.log(`Set-Cookie value: "${value}", length: ${value.length}`);
    // Display any hidden characters that might be present
    console.log('Character codes:', [...value].map(c => c.charCodeAt(0)));
  }
  
  switch (header.toLowerCase()) {
    case 'content-security-policy':
      return analyzeCsp(value || '');
    case 'set-cookie':
      return analyzeSetCookieHeader(value || '');
    case 'strict-transport-security': {
      let occurrences = 0;
      if (allHeaders) {
        occurrences = Object.keys(allHeaders).filter(
          h => h.toLowerCase() === 'strict-transport-security'
        ).length;
      } else {
        occurrences = value ? 1 : 0;
      }
      return analyzeStrictTransportSecurity(value || '', occurrences);
    }
    case 'x-frame-options':
      return analyzeXFrameOptions(value || '');
    case 'x-xss-protection':
      return value
        ? { status: 'success', message: 'XSS protection is enabled' }
        : { status: 'warning', message: 'X-XSS-Protection header is missing' };
    case 'x-content-type-options':
      return value && value.toLowerCase() === 'nosniff'
        ? { status: 'success', message: 'MIME-type sniffing prevention is enabled' }
        : { status: 'warning', message: 'MIME-type sniffing prevention is not properly configured' };
    case 'referrer-policy':
      return value
        ? { status: 'success', message: 'Referrer policy is configured' }
        : { status: 'warning', message: 'Referrer-Policy header is missing' };
    default:
      return { status: 'info', message: 'Standard header' };
  }
};

const SecurityAssessment = ({ results }: { results: SecurityResult }) => {
  // Find all "important" headers, even those not present in results.headers
  const allHeadersSet = new Set([
    ...Object.keys(results.headers).map(h => h.toLowerCase()),
    ...importantHeaders
  ]);
  const mergedHeaders = Array.from(allHeadersSet);

  const filteredMethods = Object.entries(results.methods).filter(([method]) =>
    method === 'TRACE' || method === 'DEBUG'
  );

  // Format cookie value for display
  const formatCookieValue = (value: string) => {
    if (!value) return null;
    
    const cookieStrings = value.split(/,(?=[^;]*=)/g).map(c => c.trim());
    if (cookieStrings.length <= 1) return value;
    
    return (
      <div className="space-y-1">
        {cookieStrings.map((cookie, i) => {
          const name = cookie.split('=')[0];
          return (
            <div key={i} className="border-b border-gray-100 pb-1 last:border-0">
              <span className="font-semibold">{name}</span>: {cookie.substring(name.length)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Headers Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Header</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedHeaders.map((header) => {
                // Only list interesting headers (skip standard ones that would be added by every server like 'date', 'connection', etc.)
                if (!importantHeaders.includes(header.toLowerCase())) return null;

                const value = Object.entries(results.headers).find(([h]) => h.toLowerCase() === header)?.[1];
                const { status, message } = getHeaderStatus(header, value, results.headers);
                
                return (
                  <TableRow key={header}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell className="max-w-md break-all">
                      {header.toLowerCase() === 'set-cookie' 
                        ? formatCookieValue(value) 
                        : value || <em className="text-gray-400">Not set</em>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={status === 'success' ? 'default' : status === 'warning' ? 'destructive' : 'secondary'}
                      >
                        {message}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HTTP Methods Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Code</TableHead>
                <TableHead>Security Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMethods.map(([method, enabled]) => (
                <TableRow key={method}>
                  <TableCell className="font-medium">{method}</TableCell>
                  <TableCell>
                    <Badge
                      variant={enabled ? 'destructive' : 'default'}
                      className={method === 'DEBUG' && enabled ? 'bg-[#ea384c]' : ''}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {enabled ? '200 OK' : '405 Method Not Allowed'}
                  </TableCell>
                  <TableCell>
                    {method === 'TRACE' && enabled && (
                      <span className="text-red-600">TRACE method should be disabled for security</span>
                    )}
                    {method === 'TRACE' && !enabled && (
                      <span className="text-green-600">TRACE method is properly disabled</span>
                    )}
                    {method === 'DEBUG' && enabled && (
                      <span className="text-red-600">DEBUG method is enabled - potential security risk</span>
                    )}
                    {method === 'DEBUG' && !enabled && (
                      <span className="text-green-600">DEBUG method is properly disabled</span>
                    )}
                    {method !== 'TRACE' && method !== 'DEBUG' && (
                      <span className="text-gray-600">Standard HTTP method</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export { SecurityAssessment };
