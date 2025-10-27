import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PlanningDayCell from './PlanningDayCell';
import type { WorkingHours } from '@/types/clock';
import type { Absence } from '@/types/absence';

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  work_start_time?: string;
  work_end_time?: string;
}

interface ClockDataMap {
  [userId: number]: {
    working_hours: WorkingHours[];
  };
}

interface ManagerPlanningViewProps {
  weekDays: string[];
  weekDates: Date[];
  members: TeamMember[];
  clockData: ClockDataMap;
  teamAbsences: Absence[];
  loadingTeamData: boolean;
  currentUserId?: number;
}

export default function ManagerPlanningView({
  weekDays,
  weekDates,
  members,
  clockData,
  teamAbsences,
  loadingTeamData,
  currentUserId,
}: ManagerPlanningViewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAbsence = (date: Date, userId: number) => {
    const dateStr = formatDateStr(date);
    const extractDate = (isoString: string) => isoString.split('T')[0];
    return teamAbsences.find(a => a.user_id === userId && extractDate(a.date) === dateStr) || null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/40">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Vue d'équipe
        </CardTitle>
        <CardDescription>Suivi des pointages de votre équipe pour la semaine</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-8 border-b border-t bg-gradient-to-r from-muted/80 to-muted/40 min-w-[1000px]">
            <div className="p-4 font-semibold border-r">
              <div className="flex items-center gap-2">
                Employé
              </div>
            </div>
            {weekDays.map((day, index) => {
              const isToday = weekDates[index].toDateString() === new Date().toDateString();
              return (
                <div
                  key={day}
                  className={`p-4 text-center border-r last:border-r-0 h-20 flex flex-col justify-center ${isToday ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                >
                  <div className={`font-semibold leading-tight ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {day}
                  </div>
                  {isToday && <div className="text-[10px] text-blue-600 dark:text-blue-400">(Aujourd'hui)</div>}
                  {!isToday && <div className="h-3"></div>}
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(weekDates[index])}</div>
                </div>
              );
            })}
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {members.filter((member) => member.id !== currentUserId).map((member) => (
              <div key={member.id} className="grid grid-cols-8 hover:bg-muted/20 transition-colors">
                {/* Employee Name */}
                <div className="p-4 border-r flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.work_start_time?.substring(0, 5) || '08:00'} - {member.work_end_time?.substring(0, 5) || '17:00'}
                    </p>
                  </div>
                </div>

                {/* Week Days */}
                {weekDays.map((day, dayIndex) => {
                  const dateStr = weekDates[dayIndex].toISOString().split('T')[0];
                  const memberClockData = clockData[member.id];
                  const dayData = memberClockData?.working_hours.find((wh: WorkingHours) => wh.date === dateStr);
                  const isToday = weekDates[dayIndex].toDateString() === new Date().toDateString();
                  const isLoadingMemberData = loadingTeamData && !memberClockData;
                  const absence = getAbsence(weekDates[dayIndex], member.id);

                  return (
                    <div
                      key={`${member.id}-${day}`}
                      className={`p-3 border-r last:border-r-0 text-center min-h-[100px] flex items-center justify-center ${isToday ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                    >
                      <PlanningDayCell
                        date={weekDates[dayIndex]}
                        dayData={dayData}
                        absence={absence}
                        isLoading={isLoadingMemberData}
                        isEmployee={false}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
