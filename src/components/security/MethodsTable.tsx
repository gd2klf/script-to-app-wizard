
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MethodsTableProps {
  methods: Record<string, boolean>;
}

export const MethodsTable = ({ methods }: MethodsTableProps) => {
  const filteredMethods = Object.entries(methods).filter(([method]) =>
    method === 'GET'
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
              <Badge variant={enabled ? 'default' : 'destructive'}>
                {enabled ? 'Working' : 'Error'}
              </Badge>
            </TableCell>
            <TableCell>
              {enabled ? '200 OK' : '405 Method Not Allowed'}
            </TableCell>
            <TableCell>
              <span className="text-gray-600">Standard HTTP method</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
