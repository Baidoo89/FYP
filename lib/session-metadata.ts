type SessionHeaders = {
  get(name: string): string | null;
};

export type RequestSessionMetadata = {
  ipAddress: string | null;
  maskedIpAddress: string;
  browser: string;
  platform: string;
  deviceType: string;
  device: string;
  location: string;
  userAgent: string;
};

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}

function decodeHeader(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function countryName(value: string | null) {
  const code = value?.trim().toUpperCase();
  if (!code) return null;

  const known: Record<string, string> = {
    GH: 'Ghana',
    US: 'United States',
    GB: 'United Kingdom',
  };

  return known[code] || code;
}

export function getClientIp(headers: SessionHeaders) {
  return (
    firstHeaderValue(headers.get('x-forwarded-for')) ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-client-ip') ||
    null
  );
}

export function maskIpAddress(ipAddress?: string | null) {
  const ip = ipAddress?.trim();
  if (!ip) return 'Not available';
  if (ip === '127.0.0.1' || ip === '::1' || ip.toLowerCase() === 'localhost') return 'Local network';

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  if (ip.includes(':')) {
    return `${ip.split(':').slice(0, 4).join(':')}::`;
  }

  return ip.length > 8 ? `${ip.slice(0, 5)}...` : ip;
}

export function parseBrowser(userAgent: string) {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
  return 'Unknown browser';
}

export function parsePlatform(userAgent: string) {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(userAgent)) return 'macOS';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown device';
}

export function parseDeviceType(userAgent: string) {
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/Mobile|iPhone|Android/i.test(userAgent)) return 'Mobile';
  if (userAgent) return 'Desktop';
  return 'Unknown';
}

export function getRequestLocation(headers: SessionHeaders) {
  const city = decodeHeader(headers.get('x-vercel-ip-city') || headers.get('cf-ipcity'));
  const region = decodeHeader(headers.get('x-vercel-ip-country-region'));
  const country = countryName(headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry'));

  if (city && country) return `${city}, ${country}`;
  if (region && country) return `${region}, ${country}`;
  if (country) return country;
  return 'Location unavailable';
}

export function getRequestSessionMetadata(input: { headers: SessionHeaders }): RequestSessionMetadata {
  const userAgent = input.headers.get('user-agent') || '';
  const browser = parseBrowser(userAgent);
  const platform = parsePlatform(userAgent);
  const deviceType = parseDeviceType(userAgent);
  const ipAddress = getClientIp(input.headers);

  return {
    ipAddress,
    maskedIpAddress: maskIpAddress(ipAddress),
    browser,
    platform,
    deviceType,
    device: `${browser} on ${platform}`,
    location: getRequestLocation(input.headers),
    userAgent,
  };
}
