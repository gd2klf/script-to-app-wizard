
export function analyzeXFrameOptions(value: string) {
  if (!value) {
    return { status: 'warning', message: 'X-Frame-Options header is missing' };
  }
  const val = value.trim().toUpperCase();
  if (
    val === 'DENY' ||
    val === 'SAMEORIGIN' ||
    val.startsWith('ALLOW-FROM')
  ) {
    return { status: 'success', message: 'X-Frame-Options is properly set' };
  }
  return {
    status: 'warning',
    message: "X-Frame-Options should be set to DENY, SAMEORIGIN or 'ALLOW-FROM <url>'"
  };
}
