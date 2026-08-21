import type { AuthRole } from './auth';

export const ROLE_DASHBOARDS: Record<AuthRole, string> = {
  LECTURER: '/lecturer-portal',
  STAFF: '/lecturer-portal',
  HOD_DEAN: '/hod/dashboard',
  HR_ADMIN: '/hr/dashboard',
  COMMITTEE_REVIEWER: '/committee/dashboard',
  SYSTEM_ADMIN: '/system-admin/dashboard',
};

export const ROUTE_ROLE_RULES: Array<{ prefix: string; roles: AuthRole[] }> = [
  { prefix: '/lecturer-portal', roles: ['STAFF', 'LECTURER'] },
  { prefix: '/hod', roles: ['HOD_DEAN'] },
  { prefix: '/hr', roles: ['HR_ADMIN'] },
  { prefix: '/committee', roles: ['COMMITTEE_REVIEWER'] },
  { prefix: '/system-admin', roles: ['SYSTEM_ADMIN'] },
  { prefix: '/dashboard', roles: ['HR_ADMIN'] },
  { prefix: '/analytics', roles: ['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER'] },
  { prefix: '/audit', roles: ['HR_ADMIN', 'COMMITTEE_REVIEWER'] },
  { prefix: '/lecturers', roles: ['HR_ADMIN'] },
  { prefix: '/appraisals', roles: ['HR_ADMIN'] },
  { prefix: '/promotions', roles: ['HR_ADMIN', 'HOD_DEAN', 'COMMITTEE_REVIEWER'] },
  { prefix: '/notifications', roles: ['STAFF', 'LECTURER', 'HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'] },
];

export function getDashboardForRole(role?: AuthRole | null) {
  return role ? ROLE_DASHBOARDS[role] : '/login';
}

export function getAllowedRolesForPath(pathname: string) {
  return ROUTE_ROLE_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`))?.roles;
}

export function canAccessPath(role: AuthRole | undefined | null, pathname: string) {
  const allowedRoles = getAllowedRolesForPath(pathname);
  return !allowedRoles || Boolean(role && allowedRoles.includes(role));
}

export function hasAnyRole(role: AuthRole | undefined | null, allowedRoles: AuthRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}
