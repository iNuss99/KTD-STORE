import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAdminAuthToken, getAuthToken } from '../lib/auth-storage';

export type Role = 'SUPER_ADMIN' | 'CEO' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

export interface UserAuth {
  token: string | null;
  role: Role | null; // Effective role evaluated for UI rendering
  actualRole: Role | null; // Original logged-in role
  simulatedRole: Role | null; // Simulated role if set by SUPER_ADMIN
  isSimulating: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isCEO: boolean;
  isManager: boolean;
  isStaff: boolean;
  isInternalStaff: boolean;
  canDeleteUser: boolean;
  canViewAuditLogs: boolean;
  canManualOverrideOrder: boolean;
  setSimulatedRole: (role: Role | null) => void;
}

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    return null;
  }
  return null;
};

const setStorageItem = (key: string, value: string | null) => {
  try {
    if (typeof localStorage !== 'undefined') {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
};

export function useAuth(): UserAuth {
  const [authTick, setAuthTick] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((prev) => prev + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-change', handleAuthChange);
      window.addEventListener('admin-auth-change', handleAuthChange);
      return () => {
        window.removeEventListener('auth-change', handleAuthChange);
        window.removeEventListener('admin-auth-change', handleAuthChange);
      };
    }
  }, []);

  // setSimulatedRole: stable reference
  const setSimulatedRole = useCallback((newRole: Role | null) => {
    const actualRole = (getStorageItem('admin_user_role') as Role) || null;
    if (newRole === null || newRole === actualRole) {
      setStorageItem('view_as_role', null);
    } else {
      setStorageItem('view_as_role', newRole);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admin-auth-change'));
      window.dispatchEvent(new Event('auth-change'));
    }
  }, []);

  return useMemo(() => {
    // Admin token from admin namespace; customer token from customer namespace
    const token = getAdminAuthToken() || getAuthToken();
    const actualRole = ((getStorageItem('admin_user_role') || getStorageItem('user_role')) as Role) || null;
    const simulatedRole = (getStorageItem('view_as_role') as Role) || null;

    const isAuthenticated = !!token;
    const isSuperAdminActual = actualRole === 'SUPER_ADMIN';
    const isSimulating = isSuperAdminActual && !!simulatedRole && simulatedRole !== 'SUPER_ADMIN';

    // Effective role for UI rendering
    const role: Role | null = isSimulating ? simulatedRole : actualRole;

    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isCEO = role === 'CEO';
    const isManager = role === 'MANAGER';
    const isStaff = role === 'STAFF';
    const isInternalStaff = isSuperAdmin || isCEO || isManager || isStaff;

    return {
      token,
      role,
      actualRole,
      simulatedRole,
      isSimulating,
      isAuthenticated,
      isSuperAdmin,
      isCEO,
      isManager,
      isStaff,
      isInternalStaff,
      canDeleteUser: isSuperAdmin,
      canViewAuditLogs: isSuperAdmin,
      canManualOverrideOrder: isSuperAdmin,
      setSimulatedRole,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authTick, setSimulatedRole]);
}
