
import { addLog, LogType } from "./useLog";
import { makeRequestWithRetry } from "./useRequestWithRetry";

/**
 * Checks if an HTTP method is allowed on a given URL, with special check for DEBUG.
 * DEBUG is only marked as allowed if status is 200.
 */
export const checkMethod = async (url: string, method: string): Promise<{ allowed: boolean; error?: string }> => {
  try {
    addLog('request', `Testing ${method} method...`);
    const data = await makeRequestWithRetry(url, method);

    let isAllowed = false;
    if (method === 'DEBUG') {
      // Only allowed if status is exactly 200
      isAllowed = data.status === 200;
    } else {
      isAllowed = data.status !== 405;
    }

    addLog(
      'response',
      `${method} method: ${
        isAllowed
          ? method === 'DEBUG'
            ? 'ENABLED (danger: 200 status code returned)'
            : 'ALLOWED (potentially unsafe)'
          : 'NOT ALLOWED (secure)'
      }`
    );
    return { allowed: isAllowed };
  } catch (error: any) {
    addLog('error', `Error checking ${method} method: ${error.message}`);
    return { allowed: false, error: error.message };
  }
};
