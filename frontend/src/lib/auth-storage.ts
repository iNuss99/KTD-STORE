const TOKEN_KEY = 'access_token';
const OLD_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';

export function getAuthToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(OLD_TOKEN_KEY);
    // Cleanup old token key if present
    if (token && localStorage.getItem(OLD_TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(OLD_TOKEN_KEY);
    }
    return token;
  } catch (e) {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(OLD_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Error saving auth token:', e);
  }
}

export function getRefreshToken(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  } catch (e) {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  } catch (e) {
    console.error('Error saving refresh token:', e);
  }
}

export function getUserId(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(USER_ID_KEY) : null;
  } catch (e) {
    return null;
  }
}

export function setUserId(id: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_ID_KEY, id);
    }
  } catch (e) {
    console.error('Error saving user id:', e);
  }
}

export function clearAuthToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(OLD_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem('user');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
    }
  } catch (e) {
    console.error('Error clearing auth token:', e);
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
