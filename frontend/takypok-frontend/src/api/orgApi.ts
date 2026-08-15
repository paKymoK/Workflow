import type { ResultMessage } from "./types";
import { api } from "@takypok/shared";

export interface Department {
  id: number;
  name: string;
  head: string | null;
  location: string | null;
}

export interface Unit {
  id: number;
  name: string;
  departmentId: number;
  head: string | null;
  location: string | null;
}

export interface DepartmentInput {
  name: string;
  head?: string | null;
  location?: string | null;
}

export interface UnitInput {
  name: string;
  departmentId: number;
  head?: string | null;
  location?: string | null;
}

// Reads go to employee-service's Kafka-fed mirror — auth-service stays a single cross-service
// hop away from the frontend instead of two. Writes go straight to auth-service, the
// authoritative owner; the mirror only catches up once the Kafka event lands.

export async function fetchDepartments() {
  const { data } = await api.get<ResultMessage<Department[]>>("/employee-service/v1/departments");
  return data.data;
}

export async function fetchUnits(departmentId?: number) {
  const { data } = await api.get<ResultMessage<Unit[]>>("/employee-service/v1/units", {
    params: departmentId != null ? { departmentId } : undefined,
  });
  return data.data;
}

export async function createDepartment(payload: DepartmentInput) {
  const { data } = await api.post<ResultMessage<Department>>(
    "/auth-service/v1/departments",
    payload,
  );
  return data.data;
}

export async function updateDepartment(id: number, payload: DepartmentInput) {
  const { data } = await api.put<ResultMessage<Department>>("/auth-service/v1/departments", {
    id,
    ...payload,
  });
  return data.data;
}

export async function deleteDepartment(id: number) {
  await api.delete<ResultMessage<void>>(`/auth-service/v1/departments/${id}`);
}

export async function createUnit(payload: UnitInput) {
  const { data } = await api.post<ResultMessage<Unit>>("/auth-service/v1/units", payload);
  return data.data;
}

export async function updateUnit(id: number, payload: UnitInput) {
  const { data } = await api.put<ResultMessage<Unit>>("/auth-service/v1/units", {
    id,
    ...payload,
  });
  return data.data;
}

export async function deleteUnit(id: number) {
  await api.delete<ResultMessage<void>>(`/auth-service/v1/units/${id}`);
}
