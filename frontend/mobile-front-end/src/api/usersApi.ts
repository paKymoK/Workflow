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

export async function fetchUsers(q: string, size = 10): Promise<UserSummary[]> {
  const { data } = await api.get<ResultMessage<{ content: UserSummary[] }>>(
    '/auth-service/v1/users',
    { params: { q, size } },
  );
  return data.data?.content ?? [];
}

export async function fetchUserBySub(sub: string): Promise<UserSummary | null> {
  try {
    const { data } = await api.get<ResultMessage<UserSummary>>(`/auth-service/v1/users/${sub}`);
    return data.data ?? null;
  } catch {
    return null;
  }
}
