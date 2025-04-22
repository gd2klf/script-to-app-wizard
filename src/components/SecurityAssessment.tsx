
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

const getHeaderStatus = (header: string, value: string, allHeaders?: Record<string, string>) => {
  switch (header.toLowerCase()) {
    case 'content-security-policy':
      return analyzeCsp(value);
    case 'set-cookie':
      return analyzeSetCookieHeader(value);
    case 'strict-transport-security': {
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
    case 'x-frame-options':
      return analyzeXFrameOptions(value);
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
