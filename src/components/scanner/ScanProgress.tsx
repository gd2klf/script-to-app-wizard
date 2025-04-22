
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

  // Find all method section markers
  const methodMarkers = logs
    .map((log, idx) => ({
      idx,
      method: log.message.includes("=== TESTING ")
        ? log.message.match(/=== TESTING (\w+) METHOD ===/)?.[1]
        : null,
    }))
    .filter((marker) => marker.method !== null);

  // Find the start marker for this method
  const startMarker = methodMarkers.find((marker) => marker.method === method);
  
  // If no marker found for this method, just look for errors that might mention it
  if (!startMarker) {
    // Find any error logs that explicitly mention this method
    return logs.filter((log) =>
      log.type === 'error' &&
      (log.message.toLowerCase().includes(`method ${method.toLowerCase()}`) ||
       log.message.toLowerCase().includes(`method: ${method.toLowerCase()}`) ||
       log.message.toLowerCase().includes(`with method ${method.toLowerCase()}`))
    );
  }
  
  // Find the next method marker to determine the end of this section
  const nextMethodMarker = methodMarkers.find(
    (marker) => marker.idx > startMarker.idx && marker.method !== method
  );
  const endIdx = nextMethodMarker ? nextMethodMarker.idx : logs.length;
  
  // Get all logs within this method's section
  const methodSectionLogs = logs.slice(startMarker.idx, endIdx);
  
  // Also find any error logs that mention this method but aren't in the section
  const methodErrors = logs.filter((log) =>
    log.type === 'error' &&
    !methodSectionLogs.includes(log) &&
    (log.message.toLowerCase().includes(`method ${method.toLowerCase()}`) ||
     log.message.toLowerCase().includes(`method: ${method.toLowerCase()}`) ||
     log.message.toLowerCase().includes(`with method ${method.toLowerCase()}`))
  );
  
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
