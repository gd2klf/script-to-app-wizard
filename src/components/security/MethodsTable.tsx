
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MethodsTableProps {
  methods: Record<string, boolean>;
}

export const MethodsTable = ({ methods }: MethodsTableProps) => {
  const filteredMethods = Object.entries(methods).filter(([method]) =>
    method === 'TRACE' || method === 'DEBUG'
  );

  return (
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
  );
};
