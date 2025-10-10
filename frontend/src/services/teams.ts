import axios from 'axios';
import type { Team, TeamCreate, TeamUpdate, TeamMember } from '../types/team';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const teamsApi = {
  // Get all teams
  getAll: async (): Promise<Team[]> => {
    const response = await axios.get<{ teams: Team[] }>(`${API_URL}/api/teams`);
    return response.data.teams;
  },

  // Get team by ID
  getById: async (id: number): Promise<Team> => {
    const response = await axios.get<{ team: Team }>(`${API_URL}/api/teams/${id}`);
    return response.data.team;
  },

  // Get team members
  getMembers: async (id: number): Promise<TeamMember[]> => {
    const response = await axios.get<{ members: TeamMember[] }>(`${API_URL}/api/teams/${id}/members`);
    return response.data.members;
  },

  // Create team
  create: async (data: TeamCreate): Promise<Team> => {
    const response = await axios.post<{ team: Team }>(`${API_URL}/api/teams`, data);
    return response.data.team;
  },

  // Update team
  update: async (id: number, data: TeamUpdate): Promise<Team> => {
    const response = await axios.put<{ team: Team }>(`${API_URL}/api/teams/${id}`, data);
    return response.data.team;
  },

  // Delete team
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/api/teams/${id}`);
  }
};
