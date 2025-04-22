
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIMEOUT_MS = 5000;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { url, method } = await req.json();
    
    console.log(`Scanning URL: ${url} with method: ${method || 'GET'}`);
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }
    
    // Set a reasonable timeout to avoid hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
      // Make the actual request to the target URL
      const response = await fetch(processedUrl, { 
        method: method || 'GET',
        headers: {
          'User-Agent': 'Security-Scanner/1.0'
        },
        redirect: 'manual', // Don't follow redirects automatically
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Extract headers
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Return the response details
      return new Response(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: headers,
          url: response.url,
          redirected: response.redirected,
          ok: response.ok,
          method: method || 'GET' // Return the method that was used
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.error(`Fetch error with method ${method || 'GET'}:`, fetchError);
      
      // If we have an abort error (timeout), provide a specific message
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: true, 
            message: 'Request timed out after 5 seconds',
            method: method || 'GET',
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
          method: method || 'GET'
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
