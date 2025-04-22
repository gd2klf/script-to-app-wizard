
import React from 'react';

export type LogType = 'request' | 'response' | 'error';

export interface LogEntry {
  timestamp: string;
  type: LogType;
  message: string;
}

let globalLogs: LogEntry[] = [];
let setGlobalLogs: React.Dispatch<React.SetStateAction<LogEntry[]>> | null = null;

export const setLogSetter = (setter: React.Dispatch<React.SetStateAction<LogEntry[]>>) => {
  setGlobalLogs = setter;
};

/** Adds a log entry and updates both globalLogs and local state. */
export const addLog = (type: LogType, message: string) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const newLog = { timestamp, type, message };
  globalLogs = [...globalLogs, newLog];
  if (setGlobalLogs) setGlobalLogs(prev => [...prev, newLog]);
};

/** Completely resets the logs, globally and locally. */
export const resetLogs = () => {
  globalLogs = [];
  if (setGlobalLogs) setGlobalLogs([]);
};

/** Utility to log headers (used in main hook) */
export const logHeaders = (headers: Record<string, any>, prefix: string) => {
  Object.entries(headers).forEach(([key, value]) => {
    // Handle set-cookie specially
    if (key.toLowerCase() === 'set-cookie') {
      addLog('response', `${prefix}${key}: ${value}`);
      
      // Add detailed cookie information
      if (value) {
        const cookieStrings = value.toString().split(/,(?=[^;]*=)/g);
        if (cookieStrings.length > 1) {
          addLog('response', `${prefix}Found ${cookieStrings.length} cookies:`);
          cookieStrings.forEach((cookie, i) => {
            const cookieName = cookie.split('=')[0].trim();
            addLog('response', `${prefix}  Cookie ${i+1} (${cookieName}): ${cookie.trim()}`);
          });
        }
      }
    } else {
      addLog('response', `${prefix}${key}: ${value}`);
    }
  });
};
