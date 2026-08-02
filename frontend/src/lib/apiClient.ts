import { getAuthHeader, clearAuthToken, setAuthToken, getRefreshToken, getUserId } from './auth-storage';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  const userId = getUserId();

  if (!refreshToken || !userId) return null;

  // Deduplicate concurrent refresh calls
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

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, body, ...customOptions } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isJsonBody = body && typeof body === 'string';

  const buildHeaders = (): Record<string, string> => ({
    ...getAuthHeader(),
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  });

  // First attempt
  let response = await fetch(url, {
    ...customOptions,
    headers: buildHeaders(),
    body,
  });

  // On 401 - attempt silent refresh then retry once
  if (response.status === 401) {
    const newToken = await tryRefreshToken();

    if (newToken) {
      // Retry original request with new token
      response = await fetch(url, {
        ...customOptions,
        headers: buildHeaders(),
        body,
      });
    }

    // If still 401 after refresh attempt, clear tokens and force re-login
    if (response.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
    }
  }

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

  // If response has no content (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
