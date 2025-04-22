
export function analyzeCsp(cspHeader: string) {
  if (!cspHeader) return { status: 'warning', message: 'No CSP header found' };
  const directives = cspHeader.split(';').map(d => d.trim());
  const hasDefaultSrc = directives.some(d => d.startsWith('default-src'));
  const hasScriptSrc = directives.some(d => d.startsWith('script-src'));
  const hasUnsafeInline = directives.some(d => d.includes("'unsafe-inline'"));
  const hasWildcard = directives.some(d => d.includes('*'));

  if (hasUnsafeInline || hasWildcard) {
    return { status: 'warning', message: 'CSP contains unsafe directives (unsafe-inline or wildcards)' };
  }
  if (!hasDefaultSrc) {
    return { status: 'warning', message: 'Missing default-src directive' };
  }
  if (!hasScriptSrc) {
    return { status: 'warning', message: 'Missing script-src directive' };
  }
  return { status: 'success', message: 'CSP is properly configured' };
}
