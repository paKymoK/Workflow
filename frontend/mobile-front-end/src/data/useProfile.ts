import { useAuth } from '@/src/auth/AuthContext';

import { PROFILE as MOCK_PROFILE } from './profile';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Name and LDAP sub come from the access token; the rest of PROFILE is still
// placeholder data until workflow-service exposes real employee records.
export function useProfile() {
  const { user } = useAuth();
  const name = user?.info?.name ?? MOCK_PROFILE.name;

  return {
    ...MOCK_PROFILE,
    name,
    employeeId: user?.sub ?? MOCK_PROFILE.employeeId,
    initials: user?.info?.name ? initialsOf(name) : MOCK_PROFILE.initials,
  };
}
