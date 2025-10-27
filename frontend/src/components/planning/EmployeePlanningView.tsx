import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PlanningDayCell from './PlanningDayCell';
import type { WorkingHours } from '@/types/clock';
import type { Absence } from '@/types/absence';

interface EmployeePlanningViewProps {
  weekDays: string[];
  weekDates: Date[];
  workingHours: WorkingHours[];
  absences: Absence[];
  isLoading: boolean;
}

export default function EmployeePlanningView({
  weekDays,
  weekDates,
  workingHours,
  absences,
  isLoading,
}: EmployeePlanningViewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAbsence = (date: Date) => {
    const dateStr = formatDateStr(date);
    const extractDate = (isoString: string) => isoString.split('T')[0];
    return absences.find(a => extractDate(a.date) === dateStr) || null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/40">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Planning hebdomadaire
        </CardTitle>
        <CardDescription>Détail de vos pointages pour la semaine</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 divide-x min-w-[700px]">
            {weekDays.map((day, index) => {
              const isToday = weekDates[index].toDateString() === new Date().toDateString();
              const dateStr = weekDates[index].toISOString().split('T')[0];
              const dayData = workingHours.find((wh: WorkingHours) => wh.date === dateStr);
              const absence = getAbsence(weekDates[index]);

              return (
                <div key={day} className={`p-4 ${isToday ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                  <div className="text-center mb-4 h-14 flex flex-col justify-center">
                    <div className={`font-semibold leading-tight ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {day}
                    </div>
                    {isToday && <span className="text-xs text-blue-600 dark:text-blue-400">(Aujourd'hui)</span>}
                    {!isToday && <div className="h-4"></div>}
                    <div className="text-sm text-muted-foreground mt-1">{formatDate(weekDates[index])}</div>
                  </div>
                  <div className="space-y-2 min-h-[140px] flex items-start">
                    <PlanningDayCell
                      date={weekDates[index]}
                      dayData={dayData}
                      absence={absence}
                      isLoading={isLoading}
                      isEmployee={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
