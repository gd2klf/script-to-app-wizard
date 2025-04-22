
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
  // For GET, grab anything before "=== TESTING TRACE METHOD ===" (or TRACE/DEBUG markers)
  if (method === "GET") {
    const endIdx = logs.findIndex(
      (log) =>
        log.message.includes("=== TESTING TRACE METHOD ===") ||
        log.message.includes("=== TESTING DEBUG METHOD ===")
    );
    return endIdx === -1 ? logs : logs.slice(0, endIdx);
  }
  // For TRACE or DEBUG, find method section by marker
  const marker = `=== TESTING ${method} METHOD ===`;
  const startIdx = logs.findIndex((log) => log.message.includes(marker));
  if (startIdx === -1) return [];
  // End at next marker or end of logs
  let endIdx = logs.length;
  for (let i = startIdx + 1; i < logs.length; ++i) {
    if (
      (method === "TRACE" && logs[i].message.includes("=== TESTING DEBUG METHOD ===")) ||
      (method === "DEBUG" && logs[i].message.includes("=== TESTING TRACE METHOD ==="))
    ) {
      endIdx = i;
      break;
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
  return (
    <div className="grid md:grid-cols-3 gap-4">
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
