
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
      (log) => log.message.includes("=== TESTING ") && !log.message.includes("=== TESTING GET")
    );
    return endIdx === -1 ? logs : logs.slice(0, endIdx);
  }
  return [];
}

export const ScanProgress = ({ logs }: ScanProgressProps) => {
  if (logs.length === 0) return null;

  const getLogs = filterLogsForMethod(logs, "GET");

  return getLogs.length > 0 ? (
    <div className="grid grid-cols-1 gap-4">
      <ScanProgressPanel logs={getLogs} method="GET" />
    </div>
  ) : null;
};
