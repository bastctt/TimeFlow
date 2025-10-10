export interface Clock {
  id: number;
  user_id: number;
  clock_time: string;
  status: 'check-in' | 'check-out';
  created_at: string;
}

export interface ClockStatus {
  is_clocked_in: boolean;
  last_clock: Clock | null;
}

export interface WorkingHours {
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number;
}

export interface UserClocks {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  clocks: Clock[];
  working_hours: WorkingHours[];
  total_hours: number;
}

export interface DailyReport {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number;
}

export interface WeeklyReport {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  average_daily_hours: number;
  days_worked: number;
}

export interface TeamReport {
  team_id: number;
  team_name: string;
  period_start: string;
  period_end: string;
  total_employees: number;
  total_hours: number;
  average_hours_per_employee: number;
  daily_reports?: DailyReport[];
  weekly_reports?: WeeklyReport[];
}

export interface EmployeeReport {
  employee: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_hours: number;
    days_worked: number;
    average_daily_hours: number;
  };
  daily_reports: DailyReport[];
  weekly_reports: WeeklyReport[];
}

export interface ClockIn {
  status: 'check-in' | 'check-out';
  clock_time?: string;
}
