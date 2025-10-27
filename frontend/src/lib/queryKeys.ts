// Query keys factory for TanStack Query
export const queryKeys = {
  // Teams
  teams: {
    all: ['teams'] as const,
    detail: (id: number) => ['teams', id] as const,
    members: (id: number) => ['teams', id, 'members'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    employees: ['users', 'employees'] as const,
    detail: (id: number) => ['users', id] as const,
    clocks: (id: number, startDate?: string, endDate?: string) =>
      ['users', id, 'clocks', { startDate, endDate }] as const,
  },

  // Clocks
  clocks: {
    all: ['clocks'] as const,
    my: (startDate?: string, endDate?: string) =>
      ['clocks', 'my', { startDate, endDate }] as const,
    status: ['clocks', 'status'] as const,
    issues: (startDate?: string, endDate?: string) =>
      ['clocks', 'issues', { startDate, endDate }] as const,
  },

  // Reports
  reports: {
    team: (type: string, startDate: string, endDate: string) =>
      ['reports', type, { startDate, endDate }] as const,
  },

  // Absences
  absences: {
    all: ['absences'] as const,
    my: (startDate?: string, endDate?: string) =>
      ['absences', 'my', { startDate, endDate }] as const,
    team: (startDate?: string, endDate?: string) =>
      ['absences', 'team', { startDate, endDate }] as const,
    potential: (startDate?: string, endDate?: string) =>
      ['absences', 'potential', { startDate, endDate }] as const,
    stats: (startDate?: string, endDate?: string) =>
      ['absences', 'stats', { startDate, endDate }] as const,
  },

  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },
} as const;
