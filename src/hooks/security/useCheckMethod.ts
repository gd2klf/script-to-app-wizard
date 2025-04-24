
import { addLog, logHeaders } from "./useLog";
import { makeRequestWithRetry } from "./useRequestWithRetry";

/**
 * Checks if an HTTP method is allowed on a given URL.
 */
export const checkMethod = async (url: string, method: string, withAuth?: boolean): Promise<{ allowed: boolean; error?: string }> => {
  try {
    addLog('request', `\n=== TESTING ${method} METHOD ===`);
    addLog('request', `URL: ${url}`);
    addLog('request', `Method: ${method}`);
    addLog('request', 'Headers:');
    addLog('request', '  User-Agent: Security-Scanner/1.0');
    
    if (withAuth) {
      addLog('request', '  Authorization: Bearer [token]');
    }

    try {
      const data = await makeRequestWithRetry(url, method, withAuth);

      addLog('response', `=== RESPONSE FOR ${method} METHOD ===`);
      addLog('response', `Status: ${data.status} ${data.statusText}`);
      addLog('response', 'Headers:');
      logHeaders(data.headers, '  ');

      return { allowed: data.status !== 405 };
    } catch (error: any) {
      addLog('error', `Error checking ${method} method: ${error.message}`);
      return { allowed: false, error: error.message };
    }
  } catch (error: any) {
    addLog('error', `Error checking ${method} method: ${error.message}`);
    return { allowed: false, error: error.message };
  }
};
