import { useState, useEffect } from 'react';

// services
import { teamsApi } from '@/services/teams';
import { clocksApi } from '@/services/clocks';

// types
import type { Team, TeamMember } from '@/types/team';
import type { UserClocks } from '@/types/clock';

// context
import { useAuth } from '@/context/AuthContext';

// icons
import { Calendar, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Planning() {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [clockData, setClockData] = useState<{ [userId: number]: UserClocks }>({});
  const [myClockData, setMyClockData] = useState<UserClocks | null>(null);

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const isManager = user?.role === 'Manager';

  // Load data based on role
  useEffect(() => {
    if (isManager) {
      loadManagerTeam();
    } else if (user) {
      loadEmployeeData();
    }
  }, [user, currentWeek]);

  const loadManagerTeam = async () => {
    try {
      setLoading(true);
      const teams = await teamsApi.getAll();

      // Find the team where current user is the manager
      const managerTeam = teams.find(team => team.manager_id === user?.id);

      if (managerTeam) {
        setMyTeam(managerTeam);
        const teamMembers = await teamsApi.getMembers(managerTeam.id);
        setMembers(teamMembers);

        // Load clock data for each team member
        await loadTeamClockData(teamMembers);
      }

      setError('');
    } catch (err) {
      setError('Erreur lors du chargement de l\'équipe');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const weekDates = getWeekDates();
      const startDate = weekDates[0];
      const endDate = weekDates[6];

      const data = await clocksApi.getMyClocks(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setMyClockData(data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamClockData = async (teamMembers: TeamMember[]) => {
    const weekDates = getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    const clockDataMap: { [userId: number]: UserClocks } = {};

    for (const member of teamMembers) {
      try {
        const data = await clocksApi.getUserClocks(
          member.id,
          startDate.toISOString(),
          endDate.toISOString()
        );
        clockDataMap[member.id] = data;
      } catch (err) {
        console.error(`Error loading clocks for user ${member.id}:`, err);
      }
    }

    setClockData(clockDataMap);
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return weekDays.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const weekDates = getWeekDates();

  // Employee view
  if (!isManager) {
    return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Planning</h1>
          <p className="text-muted-foreground mt-1">
            Consultez et gérez vos horaires de travail
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
          <CardContent className="p-0">
            <div className="grid grid-cols-7 divide-x">
              {weekDays.map((day, index) => (
                <div key={day} className="p-4">
                  <div className="text-center mb-4">
                    <div className="font-semibold">{day}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(weekDates[index])}</div>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const dateStr = weekDates[index].toISOString().split('T')[0];
                      const dayData = myClockData?.working_hours.find(wh => wh.date === dateStr);

                      if (dayData && dayData.hours_worked > 0) {
                        return (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                            <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-700 mb-1">
                              <Clock className="w-4 h-4" />
                              <span>{dayData.hours_worked.toFixed(1)}h</span>
                            </div>
                            <p className="text-xs text-green-600">
                              {dayData.check_in ? new Date(dayData.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              {' → '}
                              {dayData.check_out ? new Date(dayData.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                            <Clock className="w-4 h-4" />
                            <span>-</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Non pointé</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myClockData?.total_hours.toFixed(1) || '0'}h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jours cette semaine</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myClockData?.working_hours.filter(d => d.hours_worked > 0).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne/jour</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const daysWorked = myClockData?.working_hours.filter(d => d.hours_worked > 0).length || 0;
                  const totalHours = myClockData?.total_hours || 0;
                  return daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : '0';
                })()}h
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Alert>
          <Calendar className="w-5 h-5" />
          <AlertDescription>
            <span className="font-semibold block mb-1">Fonctionnalité en développement</span>
            La gestion complète des horaires et du pointage sera disponible prochainement.
            Cette vue vous permet de visualiser votre planning personnel par semaine.
          </AlertDescription>
        </Alert>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Planning de l'équipe
        </h1>
        <p className="text-muted-foreground mt-1">
          <span className="font-semibold">{myTeam.name}</span> · {members.length} membre{members.length > 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-8 border-b bg-muted/50">
              <div className="p-4 font-semibold border-r">
                Employé
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className="p-4 text-center border-r last:border-r-0"
                >
                  <div className="font-semibold">{day}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(weekDates[index])}</div>
                </div>
              ))}
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="grid grid-cols-8">
                  {/* Employee Name */}
                  <div className="p-4 border-r flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <Badge variant={member.role === 'Manager' ? 'outline' : 'outline'} className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Week Days */}
                  {weekDays.map((day, dayIndex) => {
                    const dateStr = weekDates[dayIndex].toISOString().split('T')[0];
                    const memberClockData = clockData[member.id];
                    const dayData = memberClockData?.working_hours.find(wh => wh.date === dateStr);

                    return (
                      <div
                        key={`${member.id}-${day}`}
                        className="p-4 border-r last:border-r-0 text-center"
                      >
                        {dayData && dayData.hours_worked > 0 ? (
                          <>
                            <div className="flex items-center justify-center gap-1 text-sm font-semibold text-green-700">
                              <Clock className="w-4 h-4" />
                              <span>{dayData.hours_worked.toFixed(1)}h</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {dayData.check_in ? new Date(dayData.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              {' → '}
                              {dayData.check_out ? new Date(dayData.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>-</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Non pointé</p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Alert>
        <Calendar className="w-5 h-5" />
        <AlertDescription>
          <span className="font-semibold block mb-1">Fonctionnalité en développement</span>
          La gestion complète des horaires et des plannings sera disponible prochainement.
          Cette vue vous permet de visualiser les membres de votre équipe par semaine.
        </AlertDescription>
      </Alert>
    </div>
  );
}
