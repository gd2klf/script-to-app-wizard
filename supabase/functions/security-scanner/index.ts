
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIMEOUT_MS = 5000; // 5 second timeout
const ALLOWED_METHODS = ['GET'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { url, method, withAuth } = await req.json();
    const actualMethod = (method || 'GET').toUpperCase();

    console.log(`Scanning URL: ${url} with method: ${actualMethod}${withAuth ? ' with auth' : ''}`);

    if (!url) {
      throw new Error('URL is required');
    }

    if (!ALLOWED_METHODS.includes(actualMethod)) {
      console.error(`Attempted to use disallowed method: ${actualMethod}`);
      return new Response(
        JSON.stringify({
          error: true,
          message: `HTTP method ${actualMethod} is not supported. Only GET is allowed.`,
          method: actualMethod
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }
    
    // Set a 5-second timeout to avoid hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
      // Prepare headers for the request
      const headers = {
        'User-Agent': 'Security-Scanner/1.0'
      };
      
      // Add Authorization header if withAuth is true and auth token is present in the request
      if (withAuth) {
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          headers['Authorization'] = authHeader;
        }
      }
      
      // Make the request to the target URL
      const response = await fetch(processedUrl, { 
        method: actualMethod,
        headers,
        redirect: 'manual',
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Extract headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Return the response details
      return new Response(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url,
          redirected: response.redirected,
          ok: response.ok,
          method: actualMethod
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.error(`Fetch error with method ${actualMethod}:`, fetchError);
      
      // If we have an abort error (timeout), provide a specific message
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: true, 
            message: 'Request timed out after 5 seconds',
            method: actualMethod,
            isTimeout: true
          }),
          { 
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // For other fetch errors, return a proper error response
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: fetchError.message || 'Failed to connect to the target server',
          method: actualMethod
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'An unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
