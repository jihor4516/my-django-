const DEFAULT_BACKEND_ORIGIN = 'http://127.0.0.1:8000';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function getWindowBackendOrigin() {
  if (typeof window === 'undefined') {
    return '';
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
}

function normalizeAbsoluteBackendUrl(pathOrUrl) {
  if (typeof window === 'undefined') {
    return pathOrUrl;
  }

  try {
    const url = new URL(pathOrUrl);
    if (!LOOPBACK_HOSTS.has(url.hostname)) {
      return pathOrUrl;
    }

    const { protocol, hostname } = window.location;
    url.protocol = protocol;
    url.hostname = hostname;
    if (!url.port) {
      url.port = '8000';
    }
    return url.toString();
  } catch {
    return pathOrUrl;
  }
}

export function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return `${getBackendOrigin()}/api`;
}

export function getBackendOrigin() {
  if (process.env.NEXT_PUBLIC_BACKEND_ORIGIN) {
    return process.env.NEXT_PUBLIC_BACKEND_ORIGIN.replace(/\/+$/, '');
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBase) {
    return apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  }
  return getWindowBackendOrigin() || DEFAULT_BACKEND_ORIGIN;
}

export function resolveBackendFileUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return '';
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return normalizeAbsoluteBackendUrl(pathOrUrl);
  }

  const backendOrigin = getBackendOrigin();
  const normalized = String(pathOrUrl).replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('media/')) {
    return `${backendOrigin}/${normalized}`;
  }
  if (normalized.startsWith('contracts/')) {
    return `${backendOrigin}/${normalized}`;
  }
  if (normalized.startsWith('items/') || normalized.startsWith('qrcodes/')) {
    return `${backendOrigin}/media/${normalized}`;
  }
  return `${backendOrigin}/${normalized}`;
}