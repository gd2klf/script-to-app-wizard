
import { analyzeCsp } from "./analyzeCsp";
import { analyzeSetCookieHeader } from "./analyzeSetCookie";
import { analyzeStrictTransportSecurity } from "./analyzeStrictTransportSecurity";
import { analyzeXFrameOptions } from "./analyzeXFrame";

export const importantHeaders = [
  "content-security-policy",
  "set-cookie",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy"
];

export const getHeaderStatus = (header: string, value: string | undefined, allHeaders?: Record<string, string>) => {
  // Log the header value to help with debugging
  if (header.toLowerCase() === 'set-cookie' && value) {
    console.log(`Set-Cookie value: "${value}", length: ${value.length}`);
    console.log('Character codes:', [...value].map(c => c.charCodeAt(0)));
  }
  
  switch (header.toLowerCase()) {
    case 'content-security-policy':
      return analyzeCsp(value || '');
    case 'set-cookie':
      return analyzeSetCookieHeader(value || '');
    case 'strict-transport-security': {
      let occurrences = 0;
      if (allHeaders) {
        occurrences = Object.keys(allHeaders).filter(
          h => h.toLowerCase() === 'strict-transport-security'
        ).length;
      } else {
        occurrences = value ? 1 : 0;
      }
      return analyzeStrictTransportSecurity(value || '', occurrences);
    }
    case 'x-frame-options':
      return analyzeXFrameOptions(value || '');
    case 'x-content-type-options':
      return value && value.toLowerCase() === 'nosniff'
        ? { status: 'success', message: 'MIME-type sniffing prevention is enabled' }
        : { status: 'warning', message: 'MIME-type sniffing prevention is not properly configured' };
    case 'referrer-policy':
      return value
        ? { status: 'success', message: 'Referrer policy is configured' }
        : { status: 'warning', message: 'Referrer-Policy header is missing' };
    default:
      return { status: 'info', message: 'Standard header' };
  }
};
