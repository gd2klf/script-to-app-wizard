
import { ScanProgressPanel } from "./ScanProgressPanel";

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
    <div className="grid grid-cols-1 gap-4">
      <ScanProgressPanel logs={logs} method="GET" />
    </div>
  );
};
