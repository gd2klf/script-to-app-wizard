
export function analyzeXFrameOptions(value: string) {
  if (!value) {
    return { status: 'warning', message: 'X-Frame-Options header is missing' };
  }
  // Trim whitespace from both ends
  const trimmed = value.trim();

  // Strict match for DENY and SAMEORIGIN (case-insensitive, no trailing characters allowed)
  if (/^DENY$/i.test(trimmed)) {
    return { status: 'success', message: 'X-Frame-Options is properly set' };
  }
  if (/^SAMEORIGIN$/i.test(trimmed)) {
    return { status: 'success', message: 'X-Frame-Options is properly set' };
  }
  // Strict match for ALLOW-FROM <site>, must be only one space after the hyphen
  if (/^ALLOW-FROM [^\s]+$/i.test(trimmed)) {
    return { status: 'success', message: 'X-Frame-Options is properly set' };
  }

  return {
    status: 'warning',
    message: "X-Frame-Options should be set to DENY, SAMEORIGIN or 'ALLOW-FROM <url>' with no trailing semicolons or parameters"
  };
}
