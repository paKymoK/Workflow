import axios from "axios";
import { message } from "antd";
import type {
  PageResponse, ResultMessage,
  User, UserDetail, UserGroup, UserGroupRequest,
  ClientRoleAssignment, ClientRoleAssignmentRequest,
  RegisteredClient, RegisteredClientRequest,
} from "./types";
import type { OrgChartUser } from "../utils/buildOrgChart";

const api = axios.create({ withCredentials: true });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      window.location.href = "/login";
      return Promise.reject(error);
    }
    if (status >= 400 && status < 500) {
      const msg: string = error.response?.data?.status?.message;
      message.error(msg || "Request failed");
    }
    return Promise.reject(error);
  },
);

export async function fetchUsers(page = 0, size = 10) {
  const { data } = await api.get<ResultMessage<PageResponse<User>>>("/v1/users", {
    params: { page, size },
  });
  return data.data;
}

export async function fetchUserBySub(sub: string) {
  const { data } = await api.get<ResultMessage<UserDetail>>(`/v1/users/${sub}`);
  return data.data;
}

export async function createUser(payload: {
  username: string;
  password: string;
  userinfo: { name: string; email: string; title: string; department: string };
}) {
  const { data } = await api.post<ResultMessage<void>>("/v1/users", payload);
  return data;
}

export async function fetchOrgChart() {
  const { data } = await api.get<ResultMessage<OrgChartUser[]>>("/v1/organization/chart");
  return data.data;
}

export async function fetchGroups() {
  const { data } = await api.get<ResultMessage<UserGroup[]>>("/v1/groups");
  return data.data;
}

export async function createGroup(payload: UserGroupRequest) {
  const { data } = await api.post<ResultMessage<UserGroup>>("/v1/groups", payload);
  return data.data;
}

export async function updateGroup(id: string, payload: UserGroupRequest) {
  const { data } = await api.put<ResultMessage<UserGroup>>(`/v1/groups/${id}`, payload);
  return data.data;
}

export async function deleteGroup(id: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/v1/groups/${id}`);
  return data;
}

export async function addGroupMember(groupId: string, userSub: string) {
  const { data } = await api.post<ResultMessage<void>>(`/v1/groups/${groupId}/members`, { userSub });
  return data;
}

export async function removeGroupMember(groupId: string, userSub: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/v1/groups/${groupId}/members/${userSub}`);
  return data;
}

export async function fetchClients() {
  const { data } = await api.get<ResultMessage<RegisteredClient[]>>("/v1/clients");
  return data.data;
}

export async function createClient(payload: RegisteredClientRequest) {
  const { data } = await api.post<ResultMessage<RegisteredClient>>("/v1/clients", payload);
  return data.data;
}

export async function updateClient(id: string, payload: RegisteredClientRequest) {
  const { data } = await api.put<ResultMessage<RegisteredClient>>(`/v1/clients/${id}`, payload);
  return data.data;
}

export async function deleteClient(id: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/v1/clients/${id}`);
  return data;
}

export async function fetchClientRoles(clientId: string) {
  const { data } = await api.get<ResultMessage<ClientRoleAssignment[]>>(`/v1/clients/${clientId}/roles`);
  return data.data;
}

export async function assignClientRole(clientId: string, payload: ClientRoleAssignmentRequest) {
  const { data } = await api.post<ResultMessage<ClientRoleAssignment>>(`/v1/clients/${clientId}/roles`, payload);
  return data.data;
}

export async function removeClientRole(clientId: string, assignmentId: string) {
  const { data } = await api.delete<ResultMessage<void>>(`/v1/clients/${clientId}/roles/${assignmentId}`);
  return data;
}
