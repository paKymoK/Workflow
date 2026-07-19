import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/src/auth/AuthContext';
import { fetchEmployeeBySub, fetchEmployeePersonal } from '@/src/api/employeesApi';

function initialsOf(name: string): string {
  if (!name.trim()) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function formatJoined(isoDate?: string | null): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function shiftLabel(shift?: string | null): string {
  switch (shift) {
    case 'MORNING':
      return 'Morning';
    case 'AFTERNOON':
      return 'Afternoon';
    case 'NIGHT':
      return 'Night';
    default:
      return '';
  }
}

// Every field here is blank ('' / null) until the real employee record loads — no mock
// fallback, so a failed/empty fetch reads as "no data" on screen rather than fake data.
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

  // Most employees don't have a personal record filled in yet (HR hasn't gotten to it) — this
  // resolves to null in that case, and `mobile` falls back to mock like everything else here.
  const { data: personal } = useQuery({
    queryKey: ['employee-personal', sub],
    queryFn: () => fetchEmployeePersonal(sub!),
    enabled: !!sub,
  });

  const name = employee?.name ?? '';

  return {
    name,
    initials: initialsOf(name),
    avatarUrl: employee?.avatarUrl ?? null,
    employeeId: employee?.sub ?? user?.sub ?? '',
    title: employee?.title ?? '',
    department: employee?.departmentName ?? '',
    line: employee?.unitName ?? '',
    workLocation: employee?.workLocation ?? '',
    shift: shiftLabel(employee?.shift),
    shiftHours: employee?.shiftHours ?? '',
    joined: formatJoined(employee?.joinedDate),
    manager: manager?.name ?? '',
    email: employee?.email ?? '',
    mobile: personal?.mobilePhone ?? '',
  };
}
