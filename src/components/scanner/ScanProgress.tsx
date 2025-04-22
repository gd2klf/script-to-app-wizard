
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
  // For GET, grab anything before "=== TESTING TRACE METHOD ===" or "=== TESTING DEBUG METHOD ===" markers
  if (method === "GET") {
    const endIdx = logs.findIndex(
      (log) =>
        log.message.includes("=== TESTING TRACE METHOD ===") ||
        log.message.includes("=== TESTING DEBUG METHOD ===")
    );
    return endIdx === -1 ? logs : logs.slice(0, endIdx);
  }

  // For TRACE or DEBUG, find the specific method section by marker
  const marker = `=== TESTING ${method} METHOD ===`;
  const startIdx = logs.findIndex((log) => log.message.includes(marker));
  
  if (startIdx === -1) return [];
  
  // Find the end of this method section
  // For TRACE, end at DEBUG marker or end of logs
  // For DEBUG, continue to the end of logs
  const nextMethodMarker = method === "TRACE" 
    ? "=== TESTING DEBUG METHOD ===" 
    : null; // DEBUG continues to end
  
  let endIdx = logs.length;
  if (nextMethodMarker) {
    const nextMarkerIdx = logs.findIndex((log, idx) => 
      idx > startIdx && log.message.includes(nextMethodMarker)
    );
    if (nextMarkerIdx !== -1) {
      endIdx = nextMarkerIdx;
    }
  }
  
  return logs.slice(startIdx, endIdx);
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
