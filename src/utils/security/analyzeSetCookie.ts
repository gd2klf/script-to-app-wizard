
export function analyzeSetCookieHeader(value: string) {
  if (!value || value.trim() === '') {
    return { status: 'success', message: 'No Set-Cookie header present, which is acceptable' };
  }

  // Handle multiple Set-Cookie headers that might come as an array or a string
  let cookieStrings: string[] = [];
  
  // Split by comma but only if the comma isn't inside a cookie value
  // This regex may not catch all cases, so we'll add more processing
  const initialSplit = value.split(/,(?=[^;]*=)/g);
  
  // Further process each potential cookie string
  initialSplit.forEach(cookieStr => {
    // If a cookie contains an equals sign with no semicolon before the next comma,
    // it might be incorrectly split, so we check for basic cookie structure
    if (cookieStr.includes('=')) {
      cookieStrings.push(cookieStr.trim());
    }
  });

  // If no valid cookies were found, check if the input might be a single cookie
  if (cookieStrings.length === 0 && value.includes('=')) {
    cookieStrings = [value];
  }

  const issues: string[] = [];
  let allSecure = true;
  let allHttpOnly = true;
  let cookieCount = cookieStrings.length;

  for (const cookie of cookieStrings) {
    const hasSecure = /(;|^) *secure(=|;|$)/i.test(cookie);
    const hasHttpOnly = /(;|^) *httponly(=|;|$)/i.test(cookie);

    // Extract cookie name for clarity
    const match = cookie.match(/^([^=;]*)/);
    const name = match ? match[1].trim() : '[unnamed cookie]';

    if (!hasSecure) {
      allSecure = false;
      issues.push(`Cookie "${name}" does not have the Secure flag`);
    }

    if (!hasHttpOnly) {
      allHttpOnly = false;
      issues.push(`Cookie "${name}" does not have the HttpOnly flag`);
    }
  }

  if (cookieCount === 0) {
    return { status: 'success', message: 'No cookies detected in the header' };
  }

  if (allSecure && allHttpOnly) {
    return { 
      status: 'success', 
      message: `All ${cookieCount} cookies are marked as Secure and HttpOnly` 
    };
  }

  return { 
    status: 'warning', 
    message: `Found ${cookieCount} cookies. Issues: ${issues.join('; ')}` 
  };
}
