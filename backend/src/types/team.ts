export interface Team {
  id: number;
  name: string;
  description: string | null;
  manager_id: number | null;
  created_at: Date;
  updated_at: Date;
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

export interface TeamResponse {
  id: number;
  name: string;
  description: string | null;
  manager_id: number | null;
  created_at: Date;
  updated_at: Date;
}
