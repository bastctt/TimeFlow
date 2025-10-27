import api from '@/lib/api';
import type {
  Absence,
  AbsenceCreate,
  AbsenceUpdate,
  AbsenceStats,
  PotentialAbsencesResponse,
} from '../types/absence';

export const absencesApi = {
  /**
   * Create a new absence
   */
  create: async (data: AbsenceCreate): Promise<Absence> => {
    const { data: response } = await api.post<{ absence: Absence }>('/absences', data);
    return response.absence;
  },

  /**
   * Get all absences for the current user
   */
  getMyAbsences: async (startDate?: string, endDate?: string): Promise<Absence[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<{ absences: Absence[] }>(
      `/absences${params.toString() ? `?${params.toString()}` : ''}`
    );
    return data.absences;
  },

  /**
   * Get potential absences (days without clocks or absences)
   */
  getPotentialAbsences: async (
    startDate?: string,
    endDate?: string
  ): Promise<PotentialAbsencesResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<PotentialAbsencesResponse>(
      `/absences/potential${params.toString() ? `?${params.toString()}` : ''}`
    );
    return data;
  },

  /**
   * Get absence statistics
   */
  getStats: async (startDate?: string, endDate?: string): Promise<AbsenceStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<{ stats: AbsenceStats }>(
      `/absences/stats${params.toString() ? `?${params.toString()}` : ''}`
    );
    return data.stats;
  },

  /**
   * Update an absence
   */
  update: async (id: number, data: AbsenceUpdate): Promise<Absence> => {
    const { data: response } = await api.put<{ absence: Absence }>(`/absences/${id}`, data);
    return response.absence;
  },

  /**
   * Delete an absence
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/absences/${id}`);
  },

  /**
   * Get team absences (Manager only)
   */
  getTeamAbsences: async (startDate?: string, endDate?: string): Promise<Absence[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<{ absences: Absence[] }>(
      `/absences/team${params.toString() ? `?${params.toString()}` : ''}`
    );
    return data.absences;
  },

  /**
   * Approve an absence (Manager only)
   */
  approve: async (id: number): Promise<Absence> => {
    const { data: response } = await api.post<{ absence: Absence }>(`/absences/${id}/approve`);
    return response.absence;
  },

  /**
   * Reject an absence (Manager only)
   */
  reject: async (id: number): Promise<Absence> => {
    const { data: response } = await api.post<{ absence: Absence }>(`/absences/${id}/reject`);
    return response.absence;
  },
};
