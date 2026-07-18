import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/src/auth/AuthContext';
import { fetchEmployeeBySub } from '@/src/api/employeesApi';

import { PROFILE as MOCK_PROFILE } from './profile';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function formatJoined(isoDate?: string | null): string | undefined {
  if (!isoDate) return undefined;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Falls back to mock fields field-by-field until the real employee record (and,
// once that's loaded, the manager's name) comes back — screens read the same
// shape either way, so nothing downstream needs to handle a loading state.
//
// Personal contact info (mobile phone) lives in employee-service's separate
// employee_personal record, not wired up here yet — `mobile` stays mocked.
export function useProfile() {
  const { user } = useAuth();
  const sub = user?.sub;

  const { data: employee } = useQuery({
    queryKey: ['employee', sub],
    queryFn: () => fetchEmployeeBySub(sub!),
    enabled: !!sub,
  });

  const { data: manager } = useQuery({
    queryKey: ['employee', employee?.managerSub],
    queryFn: () => fetchEmployeeBySub(employee!.managerSub!),
    enabled: !!employee?.managerSub,
  });

  const name = employee?.name ?? user?.info?.name ?? MOCK_PROFILE.name;

  return {
    ...MOCK_PROFILE,
    name,
    initials: initialsOf(name),
    employeeId: employee?.sub ?? user?.sub ?? MOCK_PROFILE.employeeId,
    title: employee?.title ?? MOCK_PROFILE.title,
    department: employee?.departmentName ?? MOCK_PROFILE.department,
    line: employee?.unitName ?? MOCK_PROFILE.line,
    workLocation: employee?.workLocation ?? MOCK_PROFILE.workLocation,
    shiftHours: employee?.shiftHours ?? MOCK_PROFILE.shiftHours,
    joined: formatJoined(employee?.joinedDate) ?? MOCK_PROFILE.joined,
    manager: manager?.name ?? MOCK_PROFILE.manager,
    email: employee?.email ?? MOCK_PROFILE.email,
  };
}
