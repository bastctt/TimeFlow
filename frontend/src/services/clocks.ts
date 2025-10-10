import axios from 'axios';
import type {
  Clock,
  ClockStatus,
  ClockIn,
  UserClocks,
  TeamReport,
  EmployeeReport
} from '../types/clock';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const clocksApi = {
  /**
   * Clock in or clock out
   */
  clockIn: async (data: ClockIn): Promise<Clock> => {
    const response = await axios.post<{ clock: Clock }>(`${API_URL}/api/clocks`, data);
    return response.data.clock;
  },

  /**
   * Get current clock status
   */
  getStatus: async (): Promise<ClockStatus> => {
    const response = await axios.get<ClockStatus>(`${API_URL}/api/clocks/status`);
    return response.data;
  },

  /**
   * Get own clocks
   */
  getMyClocks: async (startDate?: string, endDate?: string): Promise<UserClocks> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `${API_URL}/api/clocks${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axios.get<UserClocks>(url);
    return response.data;
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

    const url = `${API_URL}/api/users/${userId}/clocks${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    const response = await axios.get<UserClocks>(url);
    return response.data;
  }
};

export const reportsApi = {
  /**
   * Get team reports (Manager only)
   */
  getTeamReport: async (
    type: 'daily' | 'weekly' | 'team' = 'team',
    startDate?: string,
    endDate?: string,
    teamId?: number
  ): Promise<TeamReport> => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (teamId) params.append('team_id', teamId.toString());

    const response = await axios.get<TeamReport>(
      `${API_URL}/api/reports?${params.toString()}`
    );
    return response.data;
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

    const response = await axios.get<EmployeeReport>(
      `${API_URL}/api/reports/employee/${employeeId}${
        params.toString() ? `?${params.toString()}` : ''
      }`
    );
    return response.data;
  }
};
