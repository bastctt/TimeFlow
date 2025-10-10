export interface Team {
  id: number;
  name: string;
  description: string | null;
  manager_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TeamCreate {
  name: string;
  description?: string;
  manager_id: number;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
  manager_id?: number;
}

export interface TeamMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Manager' | 'Employé';
}
