import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

/**
 * Login
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  
  // Store token
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
}

/**
 * Register
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', userData);
  
  // Store token
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
}

/**
 * Logout
 */
export function logout(): void {
  localStorage.removeItem('token');
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data.user;
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return !!localStorage.getItem('token');
}
