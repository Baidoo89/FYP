const LOCAL_APP_URL = 'http://localhost:3000';

function addProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(addProtocol(trimmed)).origin;
  } catch {
    return null;
  }
}

export function getAppBaseUrl() {
  return (
    normalizeBaseUrl(process.env.APP_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    LOCAL_APP_URL
  );
}
