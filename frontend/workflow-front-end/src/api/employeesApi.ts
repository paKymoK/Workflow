import type { PageResponse, ResultMessage } from "./types";
import { api } from "@takypok/shared";

export type EmploymentStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
export type Shift = "MORNING" | "AFTERNOON" | "NIGHT";

export interface Employee {
  sub: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  title: string | null;
  departmentId: number | null;
  departmentName: string | null;
  unitId: number | null;
  unitName: string | null;
  workLocation: string | null;
  managerSub: string | null;
  joinedDate: string | null;
  shift: Shift | null;
  shiftHours: string | null;
  status: EmploymentStatus;
}

export interface EmployeePersonal {
  sub: string;
  personalEmail: string | null;
  mobilePhone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationalId: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface EmployeePersonalInput {
  personalEmail?: string | null;
  mobilePhone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationalId?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface EmployeeFilter {
  q?: string;
  departmentId?: number;
  unitId?: number;
  status?: EmploymentStatus;
  managerSub?: string;
  page?: number;
  size?: number;
}

export interface EmployeeUpdateInput {
  avatarUrl?: string | null;
  title?: string | null;
  departmentId?: number | null;
  unitId?: number | null;
  workLocation?: string | null;
  joinedDate?: string | null;
  shift?: Shift | null;
  shiftHours?: string | null;
}

export async function fetchEmployees(filter: EmployeeFilter = {}) {
  const { data } = await api.get<ResultMessage<PageResponse<Employee>>>(
    "/employee-service/v1/employees",
    { params: { page: 0, size: 20, ...filter } },
  );
  return data.data;
}

export async function fetchEmployeeBySub(sub: string) {
  const { data } = await api.get<ResultMessage<Employee>>(`/employee-service/v1/employees/${sub}`);
  return data.data;
}

export async function updateEmployee(sub: string, payload: EmployeeUpdateInput) {
  const { data } = await api.put<ResultMessage<Employee>>(
    `/employee-service/v1/employees/${sub}`,
    payload,
  );
  return data.data;
}

export async function updateEmployeeStatus(sub: string, status: EmploymentStatus) {
  const { data } = await api.patch<ResultMessage<Employee>>(
    `/employee-service/v1/employees/${sub}/status`,
    { status },
  );
  return data.data;
}

export async function updateEmployeeManager(sub: string, managerSub: string | null) {
  const { data } = await api.patch<ResultMessage<Employee>>(
    `/employee-service/v1/employees/${sub}/manager`,
    { managerSub },
  );
  return data.data;
}

export async function fetchEmployeePersonal(sub: string): Promise<EmployeePersonal | null> {
  try {
    const { data } = await api.get<ResultMessage<EmployeePersonal>>(
      `/employee-service/v1/employees/${sub}/personal`,
    );
    return data.data ?? null;
  } catch {
    // No personal record yet — HR hasn't filled it in, not a real failure.
    return null;
  }
}

export async function updateEmployeePersonal(sub: string, payload: EmployeePersonalInput) {
  const { data } = await api.put<ResultMessage<EmployeePersonal>>(
    `/employee-service/v1/employees/${sub}/personal`,
    payload,
  );
  return data.data;
}
