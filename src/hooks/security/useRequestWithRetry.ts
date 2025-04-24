
import { supabase } from "@/integrations/supabase/client";
import { addLog } from "./useLog";

const MAX_RETRIES = 1;
const TIMEOUT_MS = 5000;

/**
 * Performs a request using supabase.functions.invoke with retry and timeout logic.
 */
export const makeRequestWithRetry = async (
  url: string,
  method?: string,
  withAuth?: boolean,
  retryCount = 0
): Promise<any> => {
  let hasTimedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const methodName = method ? method.toUpperCase() : 'GET';

  try {
    addLog('request', `Making ${methodName} request to ${url}${withAuth ? ' with authentication' : ''}...`);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        hasTimedOut = true;
        reject(new Error(`${methodName} request timed out after 5 seconds`));
      }, TIMEOUT_MS);
    });

    const result = await Promise.race([
      supabase.functions.invoke('security-scanner', {
        body: { url, method, withAuth }
      }),
      timeoutPromise,
    ]);

    if (timeoutId) clearTimeout(timeoutId);
    const { data, error } = result as { data: any; error: any };

    if (error) {
      addLog('error', `Error with ${methodName} request: ${error.message}`);
      throw error;
    }

    if (data && data.error && data.isTimeout && retryCount < MAX_RETRIES) {
      addLog('request', `${methodName} request timed out after 5 seconds, retrying...`);
      return makeRequestWithRetry(url, method, withAuth, retryCount + 1);
    }

    if (hasTimedOut && retryCount < MAX_RETRIES) {
      addLog('request', `${methodName} request timed out after 5 seconds, retrying...`);
      return makeRequestWithRetry(url, method, withAuth, retryCount + 1);
    }

    if (data && data.error) {
      throw new Error(data.message || `${methodName} edge function error`);
    }

    addLog('response', `${methodName} request completed with status: ${data.status}`);
    return data;
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (
      (error?.message?.includes('timeout') || error?.name === 'AbortError') &&
      retryCount < MAX_RETRIES
    ) {
      addLog('request', `${methodName} request timed out after 5 seconds, retrying...`);
      return makeRequestWithRetry(url, method, withAuth, retryCount + 1);
    } else if (retryCount >= MAX_RETRIES) {
      addLog('error', `${methodName} request failed after retry: Timeout`);
      throw new Error(`${methodName} request timed out after multiple attempts`);
    }
    addLog('error', `Error with ${methodName} request: ${error.message}`);
    throw error;
  }
};
