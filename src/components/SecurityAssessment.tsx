import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SecurityResult = {
  headers: Record<string, string>;
  methods: Record<string, boolean>;
};

const analyzeCsp = (cspHeader: string) => {
  if (!cspHeader) return { status: 'warning', message: 'No CSP header found' };
  const directives = cspHeader.split(';').map(d => d.trim());
  const hasDefaultSrc = directives.some(d => d.startsWith('default-src'));
  const hasScriptSrc = directives.some(d => d.startsWith('script-src'));
  const hasUnsafeInline = directives.some(d => d.includes("'unsafe-inline'"));
  const hasWildcard = directives.some(d => d.includes('*'));

  if (hasUnsafeInline || hasWildcard) {
    return { status: 'warning', message: 'CSP contains unsafe directives (unsafe-inline or wildcards)' };
  }
  if (!hasDefaultSrc) {
    return { status: 'warning', message: 'Missing default-src directive' };
  }
  if (!hasScriptSrc) {
    return { status: 'warning', message: 'Missing script-src directive' };
  }
  return { status: 'success', message: 'CSP is properly configured' };
};

function analyzeSetCookieHeader(value: string) {
  const cookies = value.split(/,(?=[^;]*=)/g);
  const issues: string[] = [];
  let allSecure = true;
  let allHttpOnly = true;

  for (const raw of cookies) {
    const cookie = raw.trim();
    // "Secure" attribute check (case-insensitive)
    const hasSecure = /(;|^) *secure(=|;|$)/i.test(cookie);
    const hasHttpOnly = /(;|^) *httponly(=|;|$)/i.test(cookie);

    // extract cookie name for clarity
    const match = cookie.match(/^([^=;]*)/);
    const name = match ? match[1].trim() : '[unnamed cookie]';

    if (!hasSecure) {
      allSecure = false;
      issues.push(`Cookie "${name}" does not have the Secure flag`);
    }

    if (!hasHttpOnly) {
      allHttpOnly = false;
      issues.push(`Cookie "${name}" does not have the HttpOnly flag`);
    }
  }

  // Determine overall status based on both Secure and HttpOnly flags
  if (allSecure && allHttpOnly) {
    return {
      status: 'success',
      message: 'All cookies are marked as Secure and HttpOnly',
    };
  }

  return {
    status: 'warning',
    message: issues.join('; '),
  };
}

// Updated: Analyze Strict-Transport-Security header
function analyzeStrictTransportSecurity(headerValue: string, headerOccurrences: number) {
  if (!headerValue) {
    return { status: 'warning', message: 'Strict-Transport-Security header is missing' };
  }
  
  if (headerOccurrences !== 1) {
    return { status: 'warning', message: 'Strict-Transport-Security header must be present exactly once' };
  }

  // Count occurrences of max-age directive
  const maxAgeMatches = headerValue.match(/max-age=\d+/gi);
  const maxAgeCount = maxAgeMatches ? maxAgeMatches.length : 0;
  
  // Count occurrences of includeSubDomains directive (case insensitive)
  const includeSubdomainsMatches = headerValue.match(/includeSubDomains/gi);
  const includeSubdomainsCount = includeSubdomainsMatches ? includeSubdomainsMatches.length : 0;

  let issues: string[] = [];
  
  if (maxAgeCount === 0) {
    issues.push('Missing max-age directive');
  } else if (maxAgeCount > 1) {
    issues.push('Multiple max-age directives found (only one allowed)');
  }
  
  if (includeSubdomainsCount === 0) {
    issues.push('Missing includeSubDomains directive');
  } else if (includeSubdomainsCount > 1) {
    issues.push('Multiple includeSubDomains directives found (only one allowed)');
  }

  if (issues.length === 0) {
    return { status: 'success', message: 'Strict-Transport-Security is properly configured' };
  }
  
  return { status: 'warning', message: issues.join('; ') };
}

const getHeaderStatus = (header: string, value: string, allHeaders?: Record<string, string>) => {
  switch (header.toLowerCase()) {
    case 'content-security-policy':
      return analyzeCsp(value);
    case 'set-cookie':
      return analyzeSetCookieHeader(value);
    case 'strict-transport-security': {
      // Count header occurrences in a case-insensitive manner
      let occurrences = 0;
      if (allHeaders) {
        occurrences = Object.keys(allHeaders).filter(
          h => h.toLowerCase() === 'strict-transport-security'
        ).length;
      } else {
        occurrences = 1;
      }
      return analyzeStrictTransportSecurity(value, occurrences);
    }
    case 'x-xss-protection':
      return { status: 'success', message: 'XSS protection is enabled' };
    case 'x-content-type-options':
      return value.toLowerCase() === 'nosniff'
        ? { status: 'success', message: 'MIME-type sniffing prevention is enabled' }
        : { status: 'warning', message: 'MIME-type sniffing prevention is not properly configured' };
    case 'referrer-policy':
      return { status: 'success', message: 'Referrer policy is configured' };
    default:
      return { status: 'info', message: 'Standard header' };
  }
};

const SecurityAssessment = ({ results }: { results: SecurityResult }) => {
  // Restrict methods table to only TRACE and DEBUG if present
  const filteredMethods = Object.entries(results.methods).filter(([method]) =>
    method === 'TRACE' || method === 'DEBUG'
  );

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
              {Object.entries(results.headers).map(([header, value]) => {
                const { status, message } = getHeaderStatus(header, value, results.headers);
                return (
                  <TableRow key={header}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell className="max-w-md break-all">{value}</TableCell>
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
