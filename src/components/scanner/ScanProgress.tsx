
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  message: string;
}

interface ScanProgressProps {
  logs: LogEntry[];
}

export const ScanProgress = ({ logs }: ScanProgressProps) => {
  if (logs.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Scan Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-2 font-mono text-sm ${
                log.type === 'error' ? 'text-red-500' :
                log.type === 'request' ? 'text-blue-500' : 'text-green-500'
              }`}
            >
              <span className="text-gray-500">[{log.timestamp}] </span>
              {log.message}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
