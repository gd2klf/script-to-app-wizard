
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
  retryCount = 0
): Promise<any> => {
  let hasTimedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    addLog('request', `Making ${method || 'GET'} request to ${url}...`);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        hasTimedOut = true;
        reject(new Error('Request timed out after 5 seconds'));
      }, TIMEOUT_MS);
    });

    const result = await Promise.race([
      supabase.functions.invoke('security-scanner', {
        body: { url, method }
      }),
      timeoutPromise,
    ]);

    if (timeoutId) clearTimeout(timeoutId);
    const { data, error } = result as { data: any; error: any };

    if (error) {
      addLog('error', `Error with ${method || 'GET'} request: ${error.message}`);
      throw error;
    }

    if (data && data.error && data.isTimeout && retryCount < MAX_RETRIES) {
      addLog('request', `Request timed out after 5 seconds, retrying ${method || 'GET'} request...`);
      return makeRequestWithRetry(url, method, retryCount + 1);
    }

    if (hasTimedOut && retryCount < MAX_RETRIES) {
      addLog('request', `Request timed out after 5 seconds, retrying ${method || 'GET'} request...`);
      return makeRequestWithRetry(url, method, retryCount + 1);
    }

    if (data && data.error) {
      throw new Error(data.message || 'Edge function error');
    }

    addLog('response', `${method || 'GET'} request completed with status: ${data.status}`);
    return data;
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (
      (error?.message?.includes('timeout') || error?.name === 'AbortError') &&
      retryCount < MAX_RETRIES
    ) {
      addLog('request', `Request timed out after 5 seconds, retrying ${method || 'GET'} request...`);
      return makeRequestWithRetry(url, method, retryCount + 1);
    } else if (retryCount >= MAX_RETRIES) {
      addLog('error', `${method || 'GET'} request failed after retry: Timeout`);
      throw new Error(`Request timed out after multiple attempts`);
    }
    addLog('error', `Error with ${method || 'GET'} request: ${error.message}`);
    throw error;
  }
};
