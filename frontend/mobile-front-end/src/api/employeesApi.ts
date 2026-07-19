import { api } from './axios';

export interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

export interface Employee {
  sub: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  title?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  workLocation?: string | null;
  managerSub?: string | null;
  joinedDate?: string | null;
  shift?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | null;
  shiftHours?: string | null;
  status?: string;
}

export interface EmployeePersonal {
  sub: string;
  personalEmail?: string | null;
  mobilePhone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationalId?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface OrgChartNode {
  sub: string;
  name: string;
  title?: string | null;
  isManager: boolean;
  isSelf: boolean;
}

export interface OrgChart {
  chain: OrgChartNode[];
  reports: OrgChartNode[];
}

export async function fetchEmployeeBySub(sub: string): Promise<Employee | null> {
  try {
    const { data } = await api.get<ResultMessage<Employee>>(`/employee-service/v1/employees/${sub}`);
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchEmployeePersonal(sub: string): Promise<EmployeePersonal | null> {
  try {
    const { data } = await api.get<ResultMessage<EmployeePersonal>>(
      `/employee-service/v1/employees/${sub}/personal`,
    );
    return data.data ?? null;
  } catch {
    // No personal record exists yet for most employees (HR hasn't filled it in) — the backend
    // errors rather than returning an empty object, so this is expected, not a real failure.
    return null;
  }
}

export async function updateAvatar(sub: string, avatarUrl: string): Promise<Employee> {
  const { data } = await api.patch<ResultMessage<Employee>>(
    `/employee-service/v1/employees/${sub}/avatar`,
    { avatarUrl },
  );
  return data.data;
}

export async function fetchOrgChart(sub: string): Promise<OrgChart | null> {
  try {
    const { data } = await api.get<ResultMessage<OrgChart>>(
      `/employee-service/v1/employees/${sub}/org-chart`,
    );
    return data.data ?? null;
  } catch {
    return null;
  }
}
