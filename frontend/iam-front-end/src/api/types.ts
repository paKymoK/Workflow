export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

export interface User {
  sub: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatar?: string | null;
}

export type UserDetail = User;

export interface GroupMember {
  sub: string;
  name: string;
  email: string | null;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
}

export interface UserGroupRequest {
  name: string;
  description?: string;
}

export interface ClientRoleAssignment {
  id: string;
  registeredClientId: string;
  type: "USER" | "GROUP";
  subjectId: string;
  subjectName: string;
  role: string;
}

export interface ClientRoleAssignmentRequest {
  userSub?: string;
  groupId?: string;
  role: string;
}

export interface RegisteredClient {
  id: string;
  clientId: string;
  clientName: string;
  clientIdIssuedAt: string | null;
  hasSecret: boolean;
  authenticationMethods: string[];
  grantTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  requireAuthorizationConsent: boolean;
  requireProofKey: boolean;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  reuseRefreshTokens: boolean;
  singleTabSession: boolean;
  failOpen: boolean;
}

export interface RegisteredClientRequest {
  clientId: string;
  clientName?: string;
  clientSecret?: string;
  authenticationMethods: string[];
  grantTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  requireAuthorizationConsent: boolean;
  requireProofKey: boolean;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  reuseRefreshTokens: boolean;
  singleTabSession: boolean;
  failOpen: boolean;
}
