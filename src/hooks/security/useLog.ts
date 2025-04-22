
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
    addLog('response', `${prefix}${key}: ${value}`);
  });
};
