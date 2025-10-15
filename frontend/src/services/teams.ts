import api from '@/lib/api';
import type { Team, TeamCreate, TeamUpdate, TeamMember } from '../types/team';

export const teamsApi = {
  // Get all teams
  getAll: async (): Promise<Team[]> => {
    const { data } = await api.get<{ teams: Team[] }>('/teams');
    return data.teams;
  },

  // Get team by ID
  getById: async (id: number): Promise<Team> => {
    const { data } = await api.get<{ team: Team }>(`/teams/${id}`);
    return data.team;
  },

  // Get team members
  getMembers: async (id: number): Promise<TeamMember[]> => {
    const { data } = await api.get<{ members: TeamMember[] }>(`/teams/${id}/members`);
    return data.members;
  },

  // Create team
  create: async (data: TeamCreate): Promise<Team> => {
    const { data: response } = await api.post<{ team: Team }>('/teams', data);
    return response.team;
  },

  // Update team
  update: async (id: number, data: TeamUpdate): Promise<Team> => {
    const { data: response } = await api.put<{ team: Team }>(`/teams/${id}`, data);
    return response.team;
  },

  // Delete team
  delete: async (id: number): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  // Add employee to team
  addMember: async (teamId: number, userId: number): Promise<void> => {
    await api.post(`/teams/${teamId}/members`, { user_id: userId });
  },

  // Remove employee from team
  removeMember: async (teamId: number, userId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  }
};
