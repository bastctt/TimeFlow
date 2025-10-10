import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { clocksApi } from '@/services/clocks';
import ClockButton from '@/components/ClockButton';
import type { UserClocks } from '@/types/clock';

// icons
import { User, Clock, Calendar, TrendingUp, Mail, BarChart3 } from 'lucide-react';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();
  const [clockData, setClockData] = useState<UserClocks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClockData();
    }
  }, [user]);

  const loadClockData = async () => {
    try {
      // Get clocks for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const data = await clocksApi.getMyClocks(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      setClockData(data);
    } catch (err) {
      console.error('Error loading clock data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Calculate stats from real data
  const monthHours = clockData?.total_hours || 0;
  const daysWorked = clockData?.working_hours.filter(d => d.hours_worked > 0).length || 0;
  const avgDailyHours = daysWorked > 0 ? (monthHours / daysWorked).toFixed(1) : '0';

  const stats = [
    { label: 'Heures ce mois', value: `${monthHours.toFixed(1)}h`, change: `${daysWorked} jours`, icon: Clock },
    { label: 'Moyenne journalière', value: `${avgDailyHours}h`, change: 'par jour travaillé', icon: Calendar },
    { label: 'Jours travaillés', value: `${daysWorked}`, change: 'ce mois', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {user.first_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue sur votre espace de travail
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <User className="w-3 h-3 mr-1" />
          {user.role}
        </Badge>
      </div>

      {/* Employee Dashboard */}
      {user.role === 'Employé' && (
        <>
          {/* Top Section - Clock & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clock In/Out Card */}
            <ClockButton />

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Vos informations personnelles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{user.email}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Statistics Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Activité de la semaine
              </CardTitle>
              <CardDescription>
                Heures travaillées par jour (7 derniers jours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">Chargement des données...</p>
                </div>
              ) : clockData && clockData.working_hours.length > 0 ? (
                <div className="space-y-4">
                  {clockData.working_hours.slice(-7).map((item, index) => {
                    const date = new Date(item.date);
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
                    const maxHours = 10;
                    const percent = Math.min((item.hours_worked / maxHours) * 100, 100);

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize text-sm">{dayName} {date.getDate()}</span>
                          <span className="text-sm font-semibold text-blue-600">{item.hours_worked.toFixed(1)}h</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Vos informations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{user.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Accès rapide</CardTitle>
                <CardDescription>
                  Gérez votre équipe et consultez les rapports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <Users className="w-8 h-8 text-blue-500 mb-2" />
                    <h4 className="font-semibold">Mon équipe</h4>
                    <p className="text-sm text-muted-foreground">Gérer les membres</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                    <h4 className="font-semibold">Rapports</h4>
                    <p className="text-sm text-muted-foreground">Consulter les KPIs</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <Calendar className="w-8 h-8 text-purple-500 mb-2" />
                    <h4 className="font-semibold">Planning</h4>
                    <p className="text-sm text-muted-foreground">Voir les horaires</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <User className="w-8 h-8 text-orange-500 mb-2" />
                    <h4 className="font-semibold">Utilisateurs</h4>
                    <p className="text-sm text-muted-foreground">Gérer les employés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
