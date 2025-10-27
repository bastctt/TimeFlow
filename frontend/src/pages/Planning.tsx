import { useState, useMemo } from 'react';

// hooks
import { useTeams, useTeamMembers } from '@/hooks/useTeams';
import { usePlanningClocks, useTeamPlanningClocks } from '@/hooks/useClocks';
import { useMyAbsences, useTeamAbsences } from '@/hooks/useAbsences';
import { useWeekDates } from '@/hooks/usePlanningWeek';

// context
import { useAuth } from '@/context/AuthContext';

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert';

// components
import WeekNavigation from '@/components/planning/WeekNavigation';
import EmployeePlanningView from '@/components/planning/EmployeePlanningView';
import EmployeeStatsCards from '@/components/planning/EmployeeStatsCards';
import ManagerPlanningView from '@/components/planning/ManagerPlanningView';
import TeamAbsenceManager from '@/components/TeamAbsenceManager';
import AbsenceManager from '@/components/AbsenceManager';

export default function Planning() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { weekDays, weekDates, weekRange } = useWeekDates(currentWeek);
  const isManager = user?.role === 'Manager';

  // Employee data
  const { data: displayData, isLoading: loadingMyClocks } = usePlanningClocks(currentWeek, !isManager);
  const { data: myAbsences = [] } = useMyAbsences(weekRange.start, weekRange.end);

  // Manager data
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const myTeam = useMemo(() => teams.find(team => team.manager_id === user?.id), [teams, user]);
  const { data: members = [], isLoading: loadingMembers } = useTeamMembers(myTeam?.id || 0);
  const { clockData, isLoading: loadingTeamData } = useTeamPlanningClocks(members, currentWeek, isManager);
  const { data: teamAbsences = [] } = useTeamAbsences(weekRange.start, weekRange.end);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  if (!user) {
    return null;
  }

  const initialLoading = isManager ? (loadingTeams || loadingMembers) : loadingMyClocks;
  const hasNoData = isManager ? !teams.length : !displayData;

  if (initialLoading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // Employee view
  if (!isManager) {
    return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon planning</h1>
            <p className="text-muted-foreground mt-1">
              Consultez et gérez vos horaires de travail
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <WeekNavigation
          weekDates={weekDates}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onCurrentWeek={goToCurrentWeek}
        />

        {/* Employee Planning Card */}
        <EmployeePlanningView
          weekDays={weekDays}
          weekDates={weekDates}
          workingHours={displayData?.working_hours || []}
          absences={myAbsences}
          isLoading={loadingMyClocks && !displayData}
        />

        {/* Stats Cards */}
        <EmployeeStatsCards
          totalHours={displayData?.total_hours || 0}
          workingHours={displayData?.working_hours || []}
        />

        {/* Absence Manager */}
        <AbsenceManager />
      </div>
    );
  }

  // Manager view
  if (!myTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Vous n'êtes assigné à aucune équipe. Veuillez contacter un administrateur.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Planning de l'équipe
          </h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-semibold">{myTeam.name}</span> · {members.length} membre{members.length > 1 ? 's' : ''}
          </p>
        </div>
        {loadingTeamData && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span>Mise à jour...</span>
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <WeekNavigation
        weekDates={weekDates}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
      />

      {/* Planning Grid */}
      {members.length === 0 ? (
        <Alert>
          <AlertDescription>
            Aucun membre dans votre équipe
          </AlertDescription>
        </Alert>
      ) : (
        <ManagerPlanningView
          weekDays={weekDays}
          weekDates={weekDates}
          members={members}
          clockData={clockData}
          teamAbsences={teamAbsences}
          loadingTeamData={loadingTeamData}
          currentUserId={user?.id}
        />
      )}

      <TeamAbsenceManager />
    </div>
  );
}
