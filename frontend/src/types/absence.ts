export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export interface Absence {
  id: number;
  user_id: number;
  date: string; // ISO date string (YYYY-MM-DD)
  type: 'sick' | 'vacation' | 'personal' | 'other';
  reason?: string;
  approved: boolean; // Kept for backward compatibility
  approved_by?: number;
  status: AbsenceStatus;
  created_at: string;
  updated_at: string;
}

export interface AbsenceCreate {
  date: string; // ISO date string (YYYY-MM-DD)
  type?: 'sick' | 'vacation' | 'personal' | 'other';
  reason?: string;
}

export interface AbsenceUpdate {
  type?: 'sick' | 'vacation' | 'personal' | 'other';
  reason?: string;
  approved?: boolean;
  approved_by?: number;
}

export interface AbsenceStats {
  total: number;
  by_type: {
    sick: number;
    vacation: number;
    personal: number;
    other: number;
  };
  approved: number;
  pending: number;
  rejected: number;
}

export interface PotentialAbsencesResponse {
  potential_absences: string[];
  period: {
    start: string;
    end: string;
  };
}
