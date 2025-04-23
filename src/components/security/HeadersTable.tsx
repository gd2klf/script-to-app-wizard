
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importantHeaders, getHeaderStatus } from "@/utils/security/analyzeHeaders";

interface HeadersTableProps {
  headers: Record<string, string>;
}

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

export const HeadersTable = ({ headers }: HeadersTableProps) => {
  const allHeadersSet = new Set([
    ...Object.keys(headers).map(h => h.toLowerCase()),
    ...importantHeaders
  ]);
  const mergedHeaders = Array.from(allHeadersSet);

  return (
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
          if (!importantHeaders.includes(header.toLowerCase())) return null;

          const value = Object.entries(headers).find(([h]) => h.toLowerCase() === header)?.[1];
          const { status, message } = getHeaderStatus(header, value, headers);
          
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
  );
};
