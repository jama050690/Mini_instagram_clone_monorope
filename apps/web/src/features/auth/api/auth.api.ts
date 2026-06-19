import type { User } from '@/entities/user';
import { apiClient } from '@/shared/api';
import type { ApiSuccess } from '@/shared/api';

export interface AuthResult {
  user: User;
  accessToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleCompleteInput {
  registrationToken: string;
  username: string;
}

function unwrap<T>(data: ApiSuccess<T>): T {
  return data.data;
}

export async function registerRequest(input: RegisterInput): Promise<AuthResult> {
  const res = await apiClient.post<ApiSuccess<AuthResult>>('/auth/register', input);
  return unwrap(res.data);
}

export async function loginRequest(input: LoginInput): Promise<AuthResult> {
  const res = await apiClient.post<ApiSuccess<AuthResult>>('/auth/login', input);
  return unwrap(res.data);
}

export async function googleCompleteRequest(
  input: GoogleCompleteInput,
): Promise<AuthResult> {
  const res = await apiClient.post<ApiSuccess<AuthResult>>('/auth/google/complete', input);
  return unwrap(res.data);
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function meRequest(): Promise<User> {
  const res = await apiClient.get<ApiSuccess<User>>('/auth/me');
  return unwrap(res.data);
}

/** Bootstrap: refresh cookie orqali sessiyani tiklaydi (token+user). */
export async function refreshRequest(): Promise<AuthResult> {
  const res = await apiClient.post<ApiSuccess<AuthResult>>('/auth/refresh');
  return unwrap(res.data);
}
