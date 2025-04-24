
export function analyzeCsp(cspHeader: string) {
  if (!cspHeader) return { status: 'warning', message: 'No CSP header found' };
  const directives = cspHeader.split(';').map(d => d.trim());
  const hasDefaultSrc = directives.some(d => d.startsWith('default-src'));
  const hasScriptSrc = directives.some(d => d.startsWith('script-src'));

  if (!hasDefaultSrc) {
    return { status: 'warning', message: 'Missing default-src directive' };
  }
  if (!hasScriptSrc) {
    return { status: 'warning', message: 'Missing script-src directive' };
  }
  return { status: 'success', message: 'CSP is configured' };
}
