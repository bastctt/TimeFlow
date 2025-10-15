import { useState, useMemo } from 'react';

// hooks
import { useTeams, useTeamMembers } from '@/hooks/useTeams';
import { usePlanningClocks, useTeamPlanningClocks } from '@/hooks/useClocks';

// context
import { useAuth } from '@/context/AuthContext';

// types
import type { WorkingHours } from '@/types/clock';

// icons
import { Calendar, ChevronLeft, ChevronRight, Users, Clock, TrendingUp, Timer, CalendarDays } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Planning() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekDays = useMemo(() => ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'], []);
  const isManager = user?.role === 'Manager';

  // Get week dates
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return weekDays.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  }, [currentWeek, weekDays]);

  // Employee queries - optimized with parallel loading (4 weeks: prev, current, next, today)
  const { data: displayData, isLoading: loadingMyClocks } = usePlanningClocks(currentWeek, !isManager);

  // Manager queries
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const myTeam = useMemo(() => teams.find(team => team.manager_id === user?.id), [teams, user]);
  const { data: members = [], isLoading: loadingMembers } = useTeamMembers(myTeam?.id || 0);

  // Team clocks - optimized with parallel loading (4 weeks × N members)
  const { clockData, isLoading: loadingTeamData } = useTeamPlanningClocks(members, currentWeek, isManager);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

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

  // Only show full page loading on very first load
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
            <h1 className="text-3xl font-bold tracking-tight">Mon Planning</h1>
            <p className="text-muted-foreground mt-1">
              Consultez et gérez vos horaires de travail
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Button
                onClick={goToPreviousWeek}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Semaine précédente
              </Button>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">
                  {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  onClick={goToCurrentWeek}
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-initial"
                >
                  Aujourd'hui
                </Button>
                <Button
                  onClick={goToNextWeek}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 flex-1 md:flex-initial"
                >
                  Semaine suivante
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Planning Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Planning Hebdomadaire
            </CardTitle>
            <CardDescription>Détail de vos pointages pour la semaine</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 divide-x min-w-[700px]">
                {weekDays.map((day, index) => {
                  const isToday = weekDates[index].toDateString() === new Date().toDateString();
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
                        {(() => {
                          const dateStr = weekDates[index].toISOString().split('T')[0];
                          const dayData = displayData?.working_hours.find((wh: WorkingHours) => wh.date === dateStr);
                          const isLoading = loadingMyClocks && !displayData;

                          // Show skeleton with same structure as real data during first load
                          if (isLoading) {
                            return (
                              <div className="w-full p-4 border-2 rounded-lg text-center min-h-[120px] flex flex-col justify-center bg-muted/30 border-muted-foreground/20">
                                <div className="flex items-center justify-center gap-2 text-base font-bold mb-2 text-muted-foreground">
                                  <Clock className="w-5 h-5" />
                                  <span>-</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="text-xs font-medium text-muted-foreground">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <span>Arrivée:</span>
                                    <span className="font-bold">--:--</span>
                                  </div>
                                  <div className="h-4"></div>
                                </div>
                              </div>
                            );
                          }

                          if (dayData && dayData.check_in) {
                            const hasCheckout = !!dayData.check_out;
                            return (
                              <div className={`w-full p-4 border-2 rounded-lg text-center hover:shadow-md min-h-[120px] flex flex-col justify-center ${
                                hasCheckout
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:from-green-950 dark:to-emerald-950 dark:border-green-800'
                                  : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300 dark:from-blue-950 dark:to-sky-950 dark:border-blue-800 animate-pulse'
                              }`}>
                                <div className={`flex items-center justify-center gap-2 text-base font-bold mb-2 ${
                                  hasCheckout ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'
                                }`}>
                                  <Clock className="w-5 h-5 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{hasCheckout ? `${dayData.hours_worked.toFixed(1)}h` : 'En cours'}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className={`text-xs font-medium ${hasCheckout ? 'text-green-600 dark:text-green-500' : 'text-blue-600 dark:text-blue-500'}`}>
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <span>Arrivée:</span>
                                    <span className="font-bold">{new Date(dayData.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  {hasCheckout && dayData.check_out ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span>Départ:</span>
                                      <span className="font-bold">{new Date(dayData.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  ) : (
                                    <div className="h-4"></div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="w-full p-4 bg-muted/50 rounded-lg text-center border-2 border-dashed border-muted-foreground/20 min-h-[120px] flex flex-col justify-center">
                              <div className="flex items-center justify-center gap-2 text-base font-bold mb-2 text-muted-foreground">
                                <Clock className="w-5 h-5" />
                                <span>-</span>
                              </div>
                              <Separator className="my-2" />
                              <div className="text-xs font-medium text-muted-foreground">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span>Arrivée:</span>
                                  <span className="font-bold">-</span>
                                </div>
                                <div className="h-4"></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total heures</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {displayData?.total_hours.toFixed(1) || '0.0'}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cette semaine
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jours travaillés</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {displayData?.working_hours.filter((d: WorkingHours) => d.hours_worked > 0).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sur 7 jours disponibles
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne journalière</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {(() => {
                  const daysWorked = displayData?.working_hours.filter((d: WorkingHours) => d.hours_worked > 0).length || 0;
                  const totalHours = displayData?.total_hours || 0;
                  return daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : '0';
                })()}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Par jour travaillé
              </p>
            </CardContent>
          </Card>
        </div>

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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Button
              onClick={goToPreviousWeek}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              Semaine précédente
            </Button>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={goToCurrentWeek}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-initial"
              >
                Aujourd'hui
              </Button>
              <Button
                onClick={goToNextWeek}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 flex-1 md:flex-initial"
              >
                Semaine suivante
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning Grid */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun membre dans votre équipe</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/40">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Vue d'Équipe
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
                {members.map((member) => (
                  <div key={member.id} className="grid grid-cols-8 hover:bg-muted/20 transition-colors">
                    {/* Employee Name */}
                    <div className="p-4 border-r flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    {/* Week Days */}
                    {weekDays.map((day, dayIndex) => {
                      const dateStr = weekDates[dayIndex].toISOString().split('T')[0];
                      const memberClockData = clockData[member.id];
                      const dayData = memberClockData?.working_hours.find((wh: WorkingHours) => wh.date === dateStr);
                      const isToday = weekDates[dayIndex].toDateString() === new Date().toDateString();
                      const isLoadingMemberData = loadingTeamData && !memberClockData;

                      return (
                        <div
                          key={`${member.id}-${day}`}
                          className={`p-3 border-r last:border-r-0 text-center min-h-[100px] flex items-center justify-center ${isToday ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                        >
                          {isLoadingMemberData ? (
                            <div className="w-full p-2 rounded-lg bg-muted/30 min-h-[70px] flex flex-col justify-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>-</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">--:--</p>
                              <div className="h-3"></div>
                            </div>
                          ) : dayData && dayData.check_in ? (
                            <div className={`w-full p-2 rounded-lg min-h-[70px] flex flex-col justify-center ${
                              dayData.check_out
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50'
                                : 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-sky-950/50 animate-pulse'
                            }`}>
                              <div className={`flex items-center justify-center gap-1 text-sm font-bold ${
                                dayData.check_out ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'
                              }`}>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap">{dayData.check_out ? `${dayData.hours_worked.toFixed(1)}h` : 'En cours'}</span>
                              </div>
                              <p className={`text-[10px] mt-1 font-medium ${
                                dayData.check_out ? 'text-green-600 dark:text-green-500' : 'text-blue-600 dark:text-blue-500'
                              }`}>
                                {new Date(dayData.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                {dayData.check_out ? (
                                  <>
                                    <br />→ {new Date(dayData.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </>
                                ) : (
                                  <div className="h-3"></div>
                                )}
                              </p>
                            </div>
                          ) : (
                            <div className="w-full p-2 rounded-lg bg-muted/30 min-h-[70px] flex flex-col justify-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>-</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">Non pointé</p>
                              <div className="h-3"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
