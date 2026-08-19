import React from 'react';
import { useAuth, Role } from '../../hooks/useAuth';

interface PermissionGuardProps {
  allowedRoles?: Role[];
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  allowedRoles,
  requireSuperAdmin = false,
  fallback = null,
  children,
}) => {
  const { role, isSuperAdmin } = useAuth();

  if (requireSuperAdmin && !isSuperAdmin) {
    return <>{fallback}</>;
  }

  if (allowedRoles && role && !allowedRoles.includes(role) && !isSuperAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
