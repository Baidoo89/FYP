const SESSION_COOKIE_NAME = 'lpads_session';
const LEGACY_SESSION_COOKIE_VALUE = 'admin-authenticated';
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'lpads-fyp-secret';

export type EdgeAuthRole = 'LECTURER' | 'HR_ADMIN';

type EdgeAuthSession = {
  userId: number;
  name: string;
  email: string;
  role: EdgeAuthRole;
  department?: string;
  onboarded?: boolean;
  iat: number;
  exp: number;
  legacy?: boolean;
};

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let base64 = '';
  bytes.forEach((byte) => {
    base64 += String.fromCharCode(byte);
  });

  return btoa(base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecodeToBytes(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }

  return bytes;
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export async function getEdgeAuthSession(request: Request): Promise<EdgeAuthSession | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (!token) {
    return null;
  }

  if (token === LEGACY_SESSION_COOKIE_VALUE) {
    return {
      userId: 0,
      name: 'Administrator',
      email: 'admin@example.com',
      role: 'HR_ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      legacy: true,
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const key = await importSigningKey();
  const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signatureBytes = base64UrlDecodeToBytes(signature);
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, signedData);

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBytes(encodedPayload))) as EdgeAuthSession;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
