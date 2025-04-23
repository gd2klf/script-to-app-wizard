
import { addLog, LogType, logHeaders } from "./useLog";
import { makeRequestWithRetry } from "./useRequestWithRetry";

/**
 * Checks if an HTTP method is allowed on a given URL, with special check for DEBUG.
 * DEBUG is only marked as allowed if status is 200.
 * Logs request and response details for TRACE and DEBUG methods, similar to GET.
 */
export const checkMethod = async (url: string, method: string): Promise<{ allowed: boolean; error?: string }> => {
  try {
    addLog('request', `\n=== TESTING ${method} METHOD ===`);
    addLog('request', `URL: ${url}`);
    addLog('request', `Method: ${method}`);
    addLog('request', 'Headers:');
    addLog('request', '  User-Agent: Security-Scanner/1.0');

    const data = await makeRequestWithRetry(url, method);

    addLog('response', `=== RESPONSE FOR ${method} METHOD ===`);
    addLog('response', `Status: ${data.status} ${data.statusText}`);
    
    // Add more detailed response information for TRACE method
    if (method === 'TRACE') {
      if (data.status === 405 || data.status === 501) {
        addLog('response', `TRACE method properly rejected with ${data.status} status code`);
      } else if (data.error) {
        addLog('response', `TRACE request error: ${data.error}`);
      }
      
      // Log all response headers for TRACE
      addLog('response', 'Response Headers:');
      logHeaders(data.headers, '  ');
    } else {
      // For non-TRACE methods, log headers as before
      addLog('response', 'Headers:');
      logHeaders(data.headers, '  ');
    }

    let isAllowed = false;
    if (method === 'DEBUG') {
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
    // Add method to the error message to make it clear which method had an error
    addLog('error', `Error checking ${method} method: ${error.message}`);
    return { allowed: false, error: error.message };
  }
};

