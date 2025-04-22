
export function analyzeStrictTransportSecurity(headerValue: string, headerOccurrences: number) {
  if (!headerValue) {
    return { status: 'warning', message: 'Strict-Transport-Security header is missing' };
  }

  if (headerOccurrences !== 1) {
    return { status: 'warning', message: 'Strict-Transport-Security header must be present exactly once' };
  }

  const maxAgeMatches = headerValue.match(/max-age=\d+/gi);
  const maxAgeCount = maxAgeMatches ? maxAgeMatches.length : 0;
  const includeSubdomainsMatches = headerValue.match(/includeSubDomains/gi);
  const includeSubdomainsCount = includeSubdomainsMatches ? includeSubdomainsMatches.length : 0;
  let issues: string[] = [];

  if (maxAgeCount === 0) {
    issues.push('Missing max-age directive');
  } else if (maxAgeCount > 1) {
    issues.push('Multiple max-age directives found (only one allowed)');
  }

  if (includeSubdomainsCount === 0) {
    issues.push('Missing includeSubDomains directive');
  } else if (includeSubdomainsCount > 1) {
    issues.push('Multiple includeSubDomains directives found (only one allowed)');
  }

  if (issues.length === 0) {
    return { status: 'success', message: 'Strict-Transport-Security is properly configured' };
  }
  return { status: 'warning', message: issues.join('; ') };
}
