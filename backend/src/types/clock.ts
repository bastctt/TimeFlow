export interface Clock {
  id: number;
  user_id: number;
  clock_time: Date;
  status: 'check-in' | 'check-out';
  created_at: Date;
}

export interface ClockCreate {
  status: 'check-in' | 'check-out';
  clock_time?: Date; // Optional: defaults to current time
}

export interface ClockSummary {
  user_id: number;
  clocks: Clock[];
  total_hours?: number;
}

export interface WorkingHours {
  date: string;
  check_in: Date | null;
  check_out: Date | null;
  hours_worked: number;
}

export interface DailyReport {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  date: string;
  check_in: Date | null;
  check_out: Date | null;
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
