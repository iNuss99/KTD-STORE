import {
  getAuthHeader,
  clearAuthToken,
  setAuthToken,
  getRefreshToken,
  getUserId,
  decodeJwtPayload,
  getAuthToken,
  getAdminAuthHeader,
  clearAdminAuth,
  getAdminRefreshToken,
  getAdminUserId,
  setAdminAuthToken,
  getAdminAuthToken,
} from './auth-storage';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// ============================================================
// Shared URL builder
// ============================================================

function buildUrl(endpoint: string, params?: RequestOptions['params']): string {
  if (!params) return endpoint;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString
    ? endpoint + (endpoint.includes('?') ? '&' : '?') + queryString
    : endpoint;
}

// ============================================================
// Token refresh (deduplication via promise singleton)
// ============================================================

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  let userId = getUserId();
  if (!userId) {
    const token = getAuthToken();
    if (token) {
      const decoded = decodeJwtPayload(token);
      userId = decoded?.sub || null;
    }
  }
  if (!refreshToken || !userId) return null;
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
        return data.access_token;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

let isAdminRefreshing = false;
let adminRefreshPromise: Promise<string | null> | null = null;

async function tryAdminRefreshToken(): Promise<string | null> {
  const refreshToken = getAdminRefreshToken();
  let userId = getAdminUserId();
  if (!userId) {
    const token = getAdminAuthToken();
    if (token) {
      const decoded = decodeJwtPayload(token);
      userId = decoded?.sub || null;
    }
  }
  if (!refreshToken || !userId) return null;
  if (isAdminRefreshing && adminRefreshPromise) return adminRefreshPromise;

  isAdminRefreshing = true;
  adminRefreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        setAdminAuthToken(data.access_token);
        return data.access_token;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      isAdminRefreshing = false;
      adminRefreshPromise = null;
    });

  return adminRefreshPromise;
}

// ============================================================
// Shared response handler
// ============================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Ignore JSON parse error on non-JSON response
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

// ============================================================
// Client dành riêng cho Storefront (Khách hàng)
// Luôn sử dụng token customer namespace và refresh token của customer
// ============================================================

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, body, ...customOptions } = options;
  const url = buildUrl(endpoint, params);
  const isJsonBody = body && typeof body === 'string';

  const buildHeaders = (): Record<string, string> => ({
    ...getAuthHeader(),
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  });

  let response = await fetch(url, { ...customOptions, headers: buildHeaders(), body });

  if (response.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      response = await fetch(url, { ...customOptions, headers: buildHeaders(), body });
    }
    if (response.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
    }
  }

  return handleResponse<T>(response);
}

// ============================================================
// Client dành riêng cho CRM / Quản trị (Admin/Staff)
// Luôn sử dụng token admin namespace và refresh token của admin
// ============================================================

export async function adminApiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, body, ...customOptions } = options;
  const url = buildUrl(endpoint, params);
  const isJsonBody = body && typeof body === 'string';

  const buildHeaders = (): Record<string, string> => ({
    ...getAdminAuthHeader(),
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  });

  let response = await fetch(url, { ...customOptions, headers: buildHeaders(), body });

  if (response.status === 401) {
    const newToken = await tryAdminRefreshToken();
    if (newToken) {
      response = await fetch(url, { ...customOptions, headers: buildHeaders(), body });
    }
    if (response.status === 401) {
      clearAdminAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('admin-auth-change'));
      }
    }
  }

  return handleResponse<T>(response);
}
