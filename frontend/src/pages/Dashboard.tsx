import React from 'react';
import { Link } from 'react-router-dom';

// contexts
import { useAuth } from '@/context/AuthContext';
import { useClock } from '@/context/ClockContext';

// hooks
import { useMyClocks } from '@/hooks/useClocks';

// components
import ClockButton from '@/components/ClockButton';

// utils
import { formatHoursToHHMM } from '@/lib/utils';

// types
import type { WorkingHours } from '@/types/clock';

// icons
import { User, Users, Calendar, TrendingUp, Mail, BarChart3 } from 'lucide-react';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();
  const { lastClockUpdate } = useClock();

  // Get clocks for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: clockData, isLoading: loading, refetch } = useMyClocks(
    startOfMonth.toISOString(),
    endOfMonth.toISOString()
  );

  // Refetch data when clock is updated
  React.useEffect(() => {
    if (lastClockUpdate) {
      refetch();
    }
  }, [lastClockUpdate, refetch]);

  if (!user) return null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {user.first_name} 👋🏻
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue sur votre espace de travail
          </p>
        </div>
      </header>

      {/* Employee Dashboard */}
      {user.role === 'Employé' && (
        <>
          {/* Top Section - Clock & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="region" aria-label="Actions principales">
            {/* Clock In/Out Card */}
            <ClockButton />

            {/* Profile Card */}
            <Link to="/profile" aria-label="Voir mon profil">
              <Card className="cursor-pointer h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>Vos informations personnelles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground"
                      aria-hidden="true"
                    >
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
                      <Badge variant="outline" className="w-fit">
                        <User className="w-3 h-3 mr-1" aria-hidden="true" />
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Weekly Statistics Chart */}
          <Card role="region" aria-labelledby="weekly-stats-title" aria-live="polite" aria-busy={loading}>
            <CardHeader>
              <CardTitle id="weekly-stats-title" className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" aria-hidden="true" />
                Activité de la semaine
              </CardTitle>
              <CardDescription>
                Heures travaillées par jour (7 derniers jours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12" role="status" aria-label="Chargement des données d'activité">
                  <p className="text-sm text-muted-foreground">Chargement des données...</p>
                </div>
              ) : clockData && clockData.working_hours.length > 0 ? (
                <div className="space-y-4" role="list" aria-label="Heures travaillées par jour">
                  {clockData.working_hours.slice(-7).map((item: WorkingHours, index: number) => {
                    const date = new Date(item.date);
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
                    const dateFormatted = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
                    const maxHours = 10;
                    const percent = Math.min((item.hours_worked / maxHours) * 100, 100);
                    const hoursFormatted = formatHoursToHHMM(item.hours_worked);

                    return (
                      <div key={index} className="space-y-2" role="listitem">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize text-sm">{dayName} {dateFormatted}</span>
                          <span className="text-sm font-semibold text-blue-600" aria-label={`${hoursFormatted} heures travaillées`}>
                            {hoursFormatted}
                          </span>
                        </div>
                        <div
                          className="w-full bg-secondary rounded-full h-3 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={item.hours_worked}
                          aria-valuemin={0}
                          aria-valuemax={maxHours}
                          aria-label={`${hoursFormatted} sur ${maxHours} heures`}
                        >
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12" role="status">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Aucune donnée de pointage disponible
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Manager Dashboard */}
      {user.role === 'Manager' && (
        <>
          {/* Top Section - Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="region" aria-label="Informations du manager">
            <Link to="/profile" aria-label="Voir mon profil">
              <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>Vos informations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground"
                      aria-hidden="true"
                    >
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
                      <Badge variant="outline" className="w-fit">
                        <User className="w-3 h-3 mr-1" aria-hidden="true" />
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions - Full Width */}
          <Card role="region" aria-labelledby="quick-actions-title">
            <CardHeader>
              <CardTitle id="quick-actions-title">Accès rapide</CardTitle>
              <CardDescription>
                Gérez votre équipe et consultez les rapports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Navigation rapide">
                <Link
                  to="/team"
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  aria-label="Accéder à mes équipes"
                >
                  <Users className="w-8 h-8 text-blue-500 mb-2" aria-hidden="true" />
                  <h4 className="font-semibold">Mes équipes</h4>
                  <p className="text-sm text-muted-foreground">Gérer les membres</p>
                </Link>
                <Link
                  to="/reports"
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  aria-label="Consulter les rapports"
                >
                  <TrendingUp className="w-8 h-8 text-green-500 mb-2" aria-hidden="true" />
                  <h4 className="font-semibold">Rapports</h4>
                  <p className="text-sm text-muted-foreground">Consulter les KPIs</p>
                </Link>
                <Link
                  to="/schedule"
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  aria-label="Voir le planning"
                >
                  <Calendar className="w-8 h-8 text-purple-500 mb-2" aria-hidden="true" />
                  <h4 className="font-semibold">Planning</h4>
                  <p className="text-sm text-muted-foreground">Voir les horaires</p>
                </Link>
                <Link
                  to="/users"
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  aria-label="Gérer les utilisateurs"
                >
                  <User className="w-8 h-8 text-orange-500 mb-2" aria-hidden="true" />
                  <h4 className="font-semibold">Utilisateurs</h4>
                  <p className="text-sm text-muted-foreground">Gérer les employés</p>
                </Link>
              </nav>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
