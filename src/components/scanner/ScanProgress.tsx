
import { ScanProgressPanel } from "./ScanProgressPanel";

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  message: string;
}

interface ScanProgressProps {
  logs: LogEntry[];
}

function filterLogsForMethod(logs: LogEntry[], method: string) {
  // For GET, grab anything before any "=== TESTING X METHOD ===" markers
  if (method === "GET") {
    const endIdx = logs.findIndex(
      (log) => log.message.includes("=== TESTING ")
    );
    return endIdx === -1 ? logs : logs.slice(0, endIdx);
  }

  // Find the specific method section's starting point
  const marker = `=== TESTING ${method} METHOD ===`;
  const startIdx = logs.findIndex((log) => log.message.includes(marker));
  
  if (startIdx === -1) return [];
  
  // Find logs that belong to this method
  // This includes errors related to this method, which we can identify by looking for references to the method name
  let methodLogs = [];
  let inMethodSection = false;
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    
    // Start collecting logs when we find the marker
    if (log.message.includes(marker)) {
      inMethodSection = true;
      methodLogs.push(log);
      continue;
    }
    
    // Stop when we hit the next method marker
    if (inMethodSection && log.message.includes("=== TESTING ") && !log.message.includes(marker)) {
      break;
    }
    
    // Include logs that are in the method section or explicitly mention this method
    if (inMethodSection || 
        (log.type === 'error' && log.message.toLowerCase().includes(`method ${method.toLowerCase()}`))) {
      methodLogs.push(log);
    }
  }
  
  return methodLogs;
}

export const ScanProgress = ({ logs }: ScanProgressProps) => {
  if (logs.length === 0) return null;

  const getLogs = filterLogsForMethod(logs, "GET");
  const traceLogs = filterLogsForMethod(logs, "TRACE");
  const debugLogs = filterLogsForMethod(logs, "DEBUG");

  // Show panels only if logs exist for that method
  // Changed from md:grid-cols-3 to grid-cols-1 for three stacked rows
  return (
    <div className="grid grid-cols-1 gap-4">
      {getLogs.length > 0 && (
        <ScanProgressPanel logs={getLogs} method="GET" />
      )}
      {traceLogs.length > 0 && (
        <ScanProgressPanel logs={traceLogs} method="TRACE" />
      )}
      {debugLogs.length > 0 && (
        <ScanProgressPanel logs={debugLogs} method="DEBUG" />
      )}
    </div>
  );
};
