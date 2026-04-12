import api from '../api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'supplier' | 'admin' | 'staff';
  supplier?: {
    id: number;
    business_name: string;
    is_approved: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: 'customer' | 'supplier';
  business_name?: string;
  address?: string;
}

export const login = async (credentials: LoginCredentials) => {
  const { data } = await api.post<{ user: User; token: string }>('/login', credentials);
  return data;
};

export const register = async (data: RegisterData) => {
  const { data: response } = await api.post<{ user: User; token: string }>('/register', data);
  return response;
};

export const logout = async () => {
  await api.post('/logout');
};

export const getMe = async () => {
  const { data } = await api.get<User>('/me');
  return data;
};

export const requestMagicLink = async (email: string) => {
  await api.post('/magic-link/request', { email });
};

export const verifyMagicLink = async (token: string) => {
  const { data } = await api.post<{ user: User; token: string }>('/magic-link/verify', { token });
  return data;
};