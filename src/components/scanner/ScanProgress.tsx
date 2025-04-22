
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

  // Find the section markers that denote the beginning of each method section
  const methodMarkers = logs
    .map((log, idx) => ({ 
      idx, 
      method: log.message.includes("=== TESTING ") 
        ? log.message.match(/=== TESTING (\w+) METHOD ===/)?.[1] 
        : null 
    }))
    .filter(marker => marker.method !== null);
  
  // Find the start index for this method's section
  const startMarker = methodMarkers.find(marker => marker.method === method);
  if (!startMarker) return [];
  
  // Find the end index (start of next method or end of logs)
  const nextMethodMarker = methodMarkers.find(marker => 
    marker.idx > startMarker.idx && marker.method !== method
  );
  const endIdx = nextMethodMarker ? nextMethodMarker.idx : logs.length;
  
  // Get all logs from this method's section
  const methodSectionLogs = logs.slice(startMarker.idx, endIdx);
  
  // Find any error logs that explicitly mention this method but aren't in the section
  const methodErrors = logs.filter(log => 
    log.type === 'error' && 
    !methodSectionLogs.includes(log) &&
    (log.message.toLowerCase().includes(`method ${method.toLowerCase()}`) ||
     log.message.toLowerCase().includes(`method: ${method.toLowerCase()}`))
  );
  
  // Combine the section logs with any errors related to this method
  return [...methodSectionLogs, ...methodErrors];
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
