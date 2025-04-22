
export function analyzeXFrameOptions(value: string) {
  if (!value) {
    return { status: 'warning', message: 'X-Frame-Options header is missing' };
  }
  
  // Normalize the value by removing trailing semicolons and trimming whitespace
  const normalizedValue = value.replace(/;+$/, '').trim().toUpperCase();
  
  if (
    normalizedValue === 'DENY' ||
    normalizedValue === 'SAMEORIGIN' ||
    normalizedValue.startsWith('ALLOW-FROM')
  ) {
    return { status: 'success', message: 'X-Frame-Options is properly set' };
  }
  
  return {
    status: 'warning',
    message: "X-Frame-Options should be set to DENY, SAMEORIGIN or 'ALLOW-FROM <url>'"
  };
}
