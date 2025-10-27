import { Timer, CalendarDays, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatHoursToHHMM } from '@/lib/utils';
import type { WorkingHours } from '@/types/clock';

interface EmployeeStatsCardsProps {
  totalHours: number;
  workingHours: WorkingHours[];
}

export default function EmployeeStatsCards({ totalHours, workingHours }: EmployeeStatsCardsProps) {
  const daysWorked = workingHours.filter((d: WorkingHours) => d.hours_worked > 0).length;
  const averageHours = daysWorked > 0 ? totalHours / daysWorked : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Hours */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total heures</CardTitle>
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatHoursToHHMM(totalHours)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cette semaine
          </p>
        </CardContent>
      </Card>

      {/* Days Worked */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Jours travaillés</CardTitle>
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {daysWorked}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sur 7 jours disponibles
          </p>
        </CardContent>
      </Card>

      {/* Average Hours */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne journalière</CardTitle>
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {formatHoursToHHMM(averageHours)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Par jour travaillé
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
