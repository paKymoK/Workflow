import { api } from './axios';

export interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

export interface UserSummary {
  sub: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface EmployeeRecord {
  sub: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

function toUserSummary(e: EmployeeRecord): UserSummary {
  return { sub: e.sub, name: e.name, email: e.email ?? '', avatar: e.avatarUrl };
}

export async function fetchUsers(q: string, size = 10): Promise<UserSummary[]> {
  const { data } = await api.get<ResultMessage<{ content: EmployeeRecord[] }>>(
    '/employee-service/v1/employees',
    { params: { q, size } },
  );
  return (data.data?.content ?? []).map(toUserSummary);
}

export async function fetchUserBySub(sub: string): Promise<UserSummary | null> {
  try {
    const { data } = await api.get<ResultMessage<EmployeeRecord>>(`/employee-service/v1/employees/${sub}`);
    return data.data ? toUserSummary(data.data) : null;
  } catch {
    return null;
  }
}
