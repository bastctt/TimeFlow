export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Manager' | 'Employé';
  team_id?: number;
  work_start_time?: string;
  work_end_time?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'Manager' | 'Employé';
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UpdateEmployeeData {
  email?: string;
  first_name?: string;
  last_name?: string;
}
