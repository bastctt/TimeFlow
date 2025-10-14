import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTeamReport } from '@/hooks/useReports';

// icons
import { BarChart3, Calendar, Clock, TrendingUp, Users, Download, Target, UserCheck, AlarmClock, Zap, Award, AlertTriangle } from 'lucide-react';

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
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');

  // Calculate date range based on period
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (period === 'week') {
      start = new Date();
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      // Last 30 days
      start = new Date();
      start.setDate(now.getDate() - 30);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [period]);

  // Query
  const { data: report, isLoading: loading } = useTeamReport('team', startDate, endDate);

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
          <Select value={period} onValueChange={(value) => setPeriod(value as 'week' | 'month' | 'custom')}>
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

          {/* Advanced KPIs Section */}
          {report.advanced_kpis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    KPIs Avancés
                  </CardTitle>
                  <CardDescription>
                    Indicateurs de performance détaillés pour votre équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Attendance Rate */}
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div className="flex items-center justify-between mb-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-700">
                          {report.advanced_kpis.attendance_rate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Taux de présence</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {report.advanced_kpis.total_days_worked} / {report.advanced_kpis.total_workdays * report.total_employees} jours-employés
                      </p>
                    </div>

                    {/* Active Today */}
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">
                          {report.advanced_kpis.active_employees_today}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Actifs aujourd'hui</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        sur {report.total_employees} employés
                      </p>
                    </div>

                    {/* Average Check-in Time */}
                    <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
                      <div className="flex items-center justify-between mb-2">
                        <AlarmClock className="w-5 h-5 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-700">
                          {report.advanced_kpis.average_check_in_time || '-'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Arrivée moyenne</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        Horaire moyen de pointage
                      </p>
                    </div>

                    {/* Punctuality Rate */}
                    <div className="p-4 border rounded-lg bg-teal-50 dark:bg-teal-950">
                      <div className="flex items-center justify-between mb-2">
                        <Award className="w-5 h-5 text-teal-600" />
                        <span className="text-2xl font-bold text-teal-700">
                          {report.advanced_kpis.punctuality_rate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-teal-900 dark:text-teal-100">Ponctualité</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                        Arrivées avant 9h30
                      </p>
                    </div>

                    {/* Late Arrivals */}
                    <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                      <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="text-2xl font-bold text-orange-700">
                          {report.advanced_kpis.late_arrivals}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Retards</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Arrivées après 9h30
                      </p>
                    </div>

                    {/* Overtime Hours */}
                    <div className="p-4 border rounded-lg bg-indigo-50 dark:bg-indigo-950">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <span className="text-2xl font-bold text-indigo-700">
                          {report.advanced_kpis.overtime_hours.toFixed(1)}h
                        </span>
                      </div>
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Heures supp.</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Au-delà de 8h/jour
                      </p>
                    </div>

                    {/* Total Workdays */}
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                          {report.advanced_kpis.total_workdays}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Jours ouvrés</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Dans la période
                      </p>
                    </div>

                    {/* Days Worked */}
                    <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="text-2xl font-bold text-emerald-700">
                          {report.advanced_kpis.total_days_worked}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Jours travaillés</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Total équipe
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

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
