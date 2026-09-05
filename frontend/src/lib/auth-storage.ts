// ============================================================
// CUSTOMER namespace keys (storefront)
// ============================================================
const CUSTOMER_TOKEN_KEY = 'access_token';
const CUSTOMER_REFRESH_KEY = 'refresh_token';
const CUSTOMER_USER_ID_KEY = 'user_id';
const CUSTOMER_USER_KEY = 'user';
const CUSTOMER_USER_ROLE_KEY = 'user_role';
const CUSTOMER_USER_NAME_KEY = 'user_name';

// ============================================================
// ADMIN namespace keys (CRM — completely separate)
// ============================================================
const ADMIN_TOKEN_KEY = 'admin_access_token';
const ADMIN_REFRESH_KEY = 'admin_refresh_token';
const ADMIN_USER_ID_KEY = 'admin_user_id';
const ADMIN_USER_KEY = 'admin_user';
const ADMIN_USER_ROLE_KEY = 'admin_user_role';
const ADMIN_USER_NAME_KEY = 'admin_user_name';

const CUSTOMER_STORAGE_KEYS = [
  CUSTOMER_TOKEN_KEY,
  CUSTOMER_REFRESH_KEY,
  CUSTOMER_USER_ID_KEY,
  CUSTOMER_USER_KEY,
  CUSTOMER_USER_ROLE_KEY,
  CUSTOMER_USER_NAME_KEY,
  // legacy multi-namespace customer keys
  'customer_access_token',
  'customer_refresh_token',
  'customer_user_id',
  'customer_user',
  'customer_role',
  'customer_name',
];

const ADMIN_STORAGE_KEYS = [
  ADMIN_TOKEN_KEY,
  ADMIN_REFRESH_KEY,
  ADMIN_USER_ID_KEY,
  ADMIN_USER_KEY,
  ADMIN_USER_ROLE_KEY,
  ADMIN_USER_NAME_KEY,
  'view_as_role',
];

// ============================================================
// JWT decode helper (client-side, no signature verification)
// ============================================================

export function decodeJwtPayload(token: string): { sub?: string; role?: string; email?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// ============================================================
// CUSTOMER & ACTIVE STOREFRONT SESSION functions
// ============================================================

export function getAuthToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    }
    dispatchAuthEvents();
  } catch (e) {
    console.error('Error saving auth token:', e);
  }
}

export function getRefreshToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(CUSTOMER_REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOMER_REFRESH_KEY, token);
    }
  } catch (e) {
    console.error('Error saving refresh token:', e);
  }
}

export function getUserId(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const id = localStorage.getItem(CUSTOMER_USER_ID_KEY);
    if (id) return id;
    // Fallback: decode from JWT
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (token) {
      const decoded = decodeJwtPayload(token);
      return decoded?.sub || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function setUserId(id: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOMER_USER_ID_KEY, id);
    }
  } catch (e) {
    console.error('Error saving user id:', e);
  }
}

export function getUserRole(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const role = localStorage.getItem(CUSTOMER_USER_ROLE_KEY);
    if (role) return role;
    const userStr = localStorage.getItem(CUSTOMER_USER_KEY);
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.role) return u.role;
    }
    // Fallback: decode from JWT
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (token) {
      const decoded = decodeJwtPayload(token);
      return decoded?.role || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getUserName(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const name = localStorage.getItem(CUSTOMER_USER_NAME_KEY);
    if (name) return name;
    const userStr = localStorage.getItem(CUSTOMER_USER_KEY);
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.full_name || u.email) return u.full_name || u.email.split('@')[0];
    }
    // Fallback: decode from JWT
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (token) {
      const decoded = decodeJwtPayload(token);
      return decoded?.email?.split('@')[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getUser(): any | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem(CUSTOMER_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getUserPhone(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const user = getUser();
    return user?.phone || null;
  } catch {
    return null;
  }
}

/**
 * Sets the CUSTOMER active session.
 * Wipes prior customer sessions AND clears any lingering admin sessions
 * to ensure complete session isolation on this browser.
 */
export function setActiveSession(data: {
  accessToken: string;
  refreshToken?: string;
  user?: { id: string; role?: string; full_name?: string; email?: string; phone?: string } | null;
}): void {
  try {
    if (typeof localStorage !== 'undefined') {
      CUSTOMER_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      ADMIN_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

      localStorage.setItem(CUSTOMER_TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(CUSTOMER_REFRESH_KEY, data.refreshToken);
      }

      // Resolve user object — fall back to JWT decode if backend omits it
      let user = data.user;
      if (!user) {
        const decoded = decodeJwtPayload(data.accessToken);
        if (decoded) {
          user = { id: decoded.sub || '', role: decoded.role, email: decoded.email };
        }
      }

      if (user) {
        localStorage.setItem(CUSTOMER_USER_ID_KEY, user.id);
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
        localStorage.setItem(CUSTOMER_USER_ROLE_KEY, user.role || 'CUSTOMER');
        localStorage.setItem(
          CUSTOMER_USER_NAME_KEY,
          user.full_name || user.email?.split('@')[0] || 'User'
        );
      }
    }
    dispatchAuthEvents();
  } catch (e) {
    console.error('Error setting customer session:', e);
  }
}

export function clearAuthToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      CUSTOMER_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    }
    dispatchAuthEvents();
  } catch (e) {
    console.error('Error clearing customer auth:', e);
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================
// ADMIN functions (separate namespace)
// ============================================================

export function getAdminAuthToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminAuthToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
    dispatchAuthEvents();
  } catch (e) {
    console.error('Error saving admin auth token:', e);
  }
}

export function getAdminRefreshToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(ADMIN_REFRESH_KEY);
  } catch {
    return null;
  }
}

export function getAdminUserId(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(ADMIN_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function getAdminRole(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const role = localStorage.getItem(ADMIN_USER_ROLE_KEY);
    if (role) return role;
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.role || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminName(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const name = localStorage.getItem(ADMIN_USER_NAME_KEY);
    if (name) return name;
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.full_name || u.email?.split('@')[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAdminUser(): any | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Sets the ADMIN active session in the admin namespace.
 * Wipes prior admin sessions AND clears any customer sessions
 * to ensure complete session isolation.
 */
export function setAdminActiveSession(data: {
  accessToken: string;
  refreshToken?: string;
  user: { id: string; role?: string; full_name?: string; email?: string; phone?: string };
}): void {
  try {
    if (typeof localStorage !== 'undefined') {
      ADMIN_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      CUSTOMER_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

      localStorage.setItem(ADMIN_TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(ADMIN_REFRESH_KEY, data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem(ADMIN_USER_ID_KEY, data.user.id);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
        localStorage.setItem(ADMIN_USER_ROLE_KEY, data.user.role || 'STAFF');
        localStorage.setItem(
          ADMIN_USER_NAME_KEY,
          data.user.full_name || data.user.email?.split('@')[0] || 'Admin'
        );
      }
    }
    dispatchAuthEvents();
  } catch (e) {
    console.error('Error setting admin session:', e);
  }
}

export function clearAdminAuth(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      ADMIN_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    }
    dispatchAuthEvents();
  } catch (e) {
    console.error('Error clearing admin auth:', e);
  }
}

export function getAdminAuthHeader(): Record<string, string> {
  const token = getAdminAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================
// Shared helpers
// ============================================================

function dispatchAuthEvents() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'));
    window.dispatchEvent(new Event('customer-auth-change'));
    window.dispatchEvent(new Event('admin-auth-change'));
  }
}
