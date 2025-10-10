import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reportsApi } from '@/services/clocks';
import type { TeamReport } from '@/types/clock';

// icons
import { BarChart3, Calendar, Clock, TrendingUp, Users, Download } from 'lucide-react';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Reports() {
  const { user } = useAuth();
  const [report, setReport] = useState<TeamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');

  useEffect(() => {
    if (user && user.role === 'Manager') {
      loadReport();
    }
  }, [user, period]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');

      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      if (period === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        // Last 30 days
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
      }

      const data = await reportsApi.getTeamReport(
        'team',
        startDate.toISOString(),
        endDate.toISOString()
      );

      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement du rapport');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'Manager') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Cette page est réservée aux managers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement des rapports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports d'équipe</h1>
          <p className="text-muted-foreground mt-1">
            {report ? report.team_name : 'Analyse des performances'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="custom">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.total_employees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Heures Totales</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.total_hours.toFixed(1)}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne par Employé</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.average_hours_per_employee.toFixed(1)}h
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Période</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {new Date(report.period_start).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short'
                  })}
                  {' - '}
                  {new Date(report.period_end).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Reports Table */}
          {report.weekly_reports && report.weekly_reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Rapports Hebdomadaires
                </CardTitle>
                <CardDescription>
                  Résumé des heures travaillées par employé et par semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Employé</th>
                        <th className="text-left py-3 px-4 font-medium">Semaine</th>
                        <th className="text-right py-3 px-4 font-medium">Heures Totales</th>
                        <th className="text-right py-3 px-4 font-medium">Jours Travaillés</th>
                        <th className="text-right py-3 px-4 font-medium">Moyenne/Jour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.weekly_reports.map((weeklyReport, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {weeklyReport.first_name} {weeklyReport.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{weeklyReport.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {new Date(weeklyReport.week_start).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                              {' - '}
                              {new Date(weeklyReport.week_end).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {weeklyReport.total_hours.toFixed(1)}h
                          </td>
                          <td className="py-3 px-4 text-right">{weeklyReport.days_worked}</td>
                          <td className="py-3 px-4 text-right">
                            {weeklyReport.average_daily_hours.toFixed(1)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Reports Table */}
          {report.daily_reports && report.daily_reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Rapports Journaliers
                </CardTitle>
                <CardDescription>
                  Détail des pointages quotidiens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Employé</th>
                        <th className="text-left py-3 px-4 font-medium">Arrivée</th>
                        <th className="text-left py-3 px-4 font-medium">Départ</th>
                        <th className="text-right py-3 px-4 font-medium">Heures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.daily_reports.slice(0, 20).map((dailyReport, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {dailyReport.date
                              ? new Date(dailyReport.date).toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short'
                                })
                              : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {dailyReport.first_name} {dailyReport.last_name}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {dailyReport.check_in
                              ? new Date(dailyReport.check_in).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {dailyReport.check_out
                              ? new Date(dailyReport.check_out).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {dailyReport.hours_worked.toFixed(1)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.daily_reports.length > 20 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Affichage de 20 sur {report.daily_reports.length} enregistrements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No data message */}
          {(!report.daily_reports || report.daily_reports.length === 0) &&
            (!report.weekly_reports || report.weekly_reports.length === 0) && (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune donnée de pointage pour cette période
                  </p>
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  );
}
