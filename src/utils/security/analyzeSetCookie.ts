
export function analyzeSetCookieHeader(value: string) {
  if (!value || value.trim() === '') {
    return { status: 'success', message: 'No Set-Cookie header present, which is acceptable' };
  }

  const cookies = value.split(/,(?=[^;]*=)/g);
  const issues: string[] = [];
  let allSecure = true;
  let allHttpOnly = true;

  for (const raw of cookies) {
    const cookie = raw.trim();
    const hasSecure = /(;|^) *secure(=|;|$)/i.test(cookie);
    const hasHttpOnly = /(;|^) *httponly(=|;|$)/i.test(cookie);

    // extract cookie name for clarity
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

  if (allSecure && allHttpOnly) {
    return { status: 'success', message: 'All cookies are marked as Secure and HttpOnly' };
  }

  return { status: 'warning', message: issues.join('; ') };
}
