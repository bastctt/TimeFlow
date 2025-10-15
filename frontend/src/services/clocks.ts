import api from '@/lib/api';
import type {
  Clock,
  ClockStatus,
  ClockIn,
  UserClocks,
  TeamReport,
  EmployeeReport
} from '../types/clock';

export const clocksApi = {
  /**
   * Clock in or clock out
   */
  clockIn: async (data: ClockIn): Promise<Clock> => {
    const { data: response } = await api.post<{ clock: Clock }>('/clocks', data);
    return response.clock;
  },

  /**
   * Clock in or clock out (alias)
   */
  clockInOut: async (data: ClockIn): Promise<Clock> => {
    const { data: response } = await api.post<{ clock: Clock }>('/clocks', data);
    return response.clock;
  },

  /**
   * Get current clock status
   */
  getStatus: async (): Promise<ClockStatus> => {
    const { data } = await api.get<ClockStatus>('/clocks/status');
    return data;
  },

  /**
   * Get own clocks
   */
  getMyClocks: async (startDate?: string, endDate?: string): Promise<UserClocks> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<UserClocks>(`/clocks${params.toString() ? `?${params.toString()}` : ''}`);
    return data;
  },

  /**
   * Get clocks for a specific user (manager can view team members)
   */
  getUserClocks: async (
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<UserClocks> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<UserClocks>(`/users/${userId}/clocks${
      params.toString() ? `?${params.toString()}` : ''
    }`);
    return data;
  }
};

export const reportsApi = {
  /**
   * Get team reports (Manager only)
   */
  getTeamReport: async (
    type?: 'daily' | 'weekly' | 'team',
    startDate?: string,
    endDate?: string,
    teamId?: number
  ): Promise<TeamReport> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (teamId) params.append('team_id', teamId.toString());

    const { data } = await api.get<TeamReport>(
      `/reports?${params.toString()}`
    );
    return data;
  },

  /**
   * Get individual employee report
   */
  getEmployeeReport: async (
    employeeId: number,
    startDate?: string,
    endDate?: string
  ): Promise<EmployeeReport> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get<EmployeeReport>(
      `/reports/employee/${employeeId}${
        params.toString() ? `?${params.toString()}` : ''
      }`
    );
    return data;
  }
};
