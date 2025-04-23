
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  message: string;
}

interface ScanProgressPanelProps {
  logs: LogEntry[];
  method: string;
}

export const ScanProgressPanel = ({ logs, method }: ScanProgressPanelProps) => {
  if (logs.length === 0) return null;

  // Format log message for better cookie display
  const formatLogMessage = (message: string) => {
    // Check if this is a Set-Cookie header and format it
    if (message.startsWith('  set-cookie:') || message.startsWith('  Set-Cookie:')) {
      const cookieValue = message.substring(message.indexOf(':') + 1).trim();
      
      // Split multiple cookies if present
      const cookies = cookieValue.split(/,(?=[^;]*=)/g).map(c => c.trim());
      
      if (cookies.length > 1) {
        return (
          <>
            {message.substring(0, message.indexOf(':') + 1)}
            <div className="pl-4 mt-1">
              {cookies.map((cookie, i) => (
                <div key={i} className="text-xs mb-1">• {cookie}</div>
              ))}
            </div>
          </>
        );
      }
    }
    
    return message;
  };

  // Check if we have a special message for rejected methods
  const hasRejectionMessage = logs.some(log => 
    log.message.includes(`${method} method rejected by server`) || 
    log.message.includes('method not allowed') ||
    log.message.includes('Method is forbidden')
  );

  // Determine if method is secure or not
  const methodStatus = logs.find(log => log.message.includes(`${method} method:`))?.message || '';
  const isSecure = methodStatus.includes('NOT ALLOWED (secure)');

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>
          {method} Scan Progress
          {hasRejectionMessage && (
            <span className={`ml-2 text-sm ${isSecure ? 'text-green-600' : 'text-red-500'}`}>
              ({isSecure ? 'Blocked' : 'Vulnerable'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border bg-slate-50 p-4 font-mono">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-2 whitespace-pre-wrap text-sm ${
                log.type === 'error' ? 'text-red-500' :
                log.type === 'request' ? 'text-blue-500' : 'text-green-600'
              }`}
            >
              <span className="text-gray-500">[{log.timestamp}] </span>
              {formatLogMessage(log.message)}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
