
export function analyzeXFrameOptions(value: string) {
  if (!value) {
    return { status: 'warning', message: 'X-Frame-Options header is missing' };
  }
  
  // Trim whitespace from both ends and normalize to uppercase for comparison
  const trimmed = value.trim().toUpperCase();

  // Strict match for DENY and SAMEORIGIN
  if (trimmed === 'DENY') {
    return { status: 'success', message: 'X-Frame-Options is properly set to DENY' };
  }
  
  if (trimmed === 'SAMEORIGIN') {
    return { status: 'success', message: 'X-Frame-Options is properly set to SAMEORIGIN' };
  }
  
  // Check for ALLOW-FROM format
  if (trimmed.startsWith('ALLOW-FROM ')) {
    const url = trimmed.substring('ALLOW-FROM '.length).trim();
    if (url && !url.includes(';')) {
      return { status: 'success', message: `X-Frame-Options is set to allow from ${url}` };
    }
  }

  return {
    status: 'warning',
    message: "X-Frame-Options should be set to DENY, SAMEORIGIN or 'ALLOW-FROM <url>' with no trailing semicolons or parameters"
  };
}
