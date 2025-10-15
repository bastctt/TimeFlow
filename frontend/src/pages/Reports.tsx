import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAllReportPeriods } from '@/hooks/useReports';
import { toast } from 'sonner';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');

  // Load all report periods at once
  const allReports = useAllReportPeriods();

  // Get the current report based on selected period
  const report = period === 'week' ? allReports.week : period === 'month' ? allReports.month : allReports.custom;

  // Export functions
  const exportToCSV = () => {
    if (!report) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      let csv = 'Type,Employé,Email,Date/Semaine,Arrivée,Départ,Heures\n';

      // Add daily reports
      if (report.daily_reports && report.daily_reports.length > 0) {
        report.daily_reports.forEach(dr => {
          csv += `Journalier,"${dr.first_name} ${dr.last_name}","${dr.email}",`;
          csv += `${dr.date ? new Date(dr.date).toLocaleDateString('fr-FR') : '-'},`;
          csv += `${dr.check_in ? new Date(dr.check_in).toLocaleTimeString('fr-FR') : '-'},`;
          csv += `${dr.check_out ? new Date(dr.check_out).toLocaleTimeString('fr-FR') : '-'},`;
          csv += `${dr.hours_worked.toFixed(1)}\n`;
        });
      }

      // Add weekly reports
      if (report.weekly_reports && report.weekly_reports.length > 0) {
        report.weekly_reports.forEach(wr => {
          csv += `Hebdomadaire,"${wr.first_name} ${wr.last_name}","${wr.email}",`;
          csv += `"${new Date(wr.week_start).toLocaleDateString('fr-FR')} - ${new Date(wr.week_end).toLocaleDateString('fr-FR')}",`;
          csv += `-,-,${wr.total_hours.toFixed(1)}\n`;
        });
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export CSV réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export CSV');
      console.error(error)
    }
  };

  const exportToJSON = () => {
    if (!report) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_${period}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export JSON réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export JSON');
      console.error(error)
    }
  };

  const exportToExcel = () => {
    if (!report) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      // Create Excel-compatible HTML table
      let html = '<html><head><meta charset="utf-8"></head><body>';
      html += '<table border="1">';

      // Header
      html += '<tr><th>Type</th><th>Employé</th><th>Email</th><th>Date/Semaine</th><th>Arrivée</th><th>Départ</th><th>Heures</th></tr>';

      // Daily reports
      if (report.daily_reports && report.daily_reports.length > 0) {
        report.daily_reports.forEach(dr => {
          html += '<tr>';
          html += '<td>Journalier</td>';
          html += `<td>${dr.first_name} ${dr.last_name}</td>`;
          html += `<td>${dr.email}</td>`;
          html += `<td>${dr.date ? new Date(dr.date).toLocaleDateString('fr-FR') : '-'}</td>`;
          html += `<td>${dr.check_in ? new Date(dr.check_in).toLocaleTimeString('fr-FR') : '-'}</td>`;
          html += `<td>${dr.check_out ? new Date(dr.check_out).toLocaleTimeString('fr-FR') : '-'}</td>`;
          html += `<td>${dr.hours_worked.toFixed(1)}</td>`;
          html += '</tr>';
        });
      }

      // Weekly reports
      if (report.weekly_reports && report.weekly_reports.length > 0) {
        report.weekly_reports.forEach(wr => {
          html += '<tr>';
          html += '<td>Hebdomadaire</td>';
          html += `<td>${wr.first_name} ${wr.last_name}</td>`;
          html += `<td>${wr.email}</td>`;
          html += `<td>${new Date(wr.week_start).toLocaleDateString('fr-FR')} - ${new Date(wr.week_end).toLocaleDateString('fr-FR')}</td>`;
          html += '<td>-</td><td>-</td>';
          html += `<td>${wr.total_hours.toFixed(1)}</td>`;
          html += '</tr>';
        });
      }

      html += '</table></body></html>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_${period}_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Excel réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export Excel');
      console.error(error)
    }
  };

  // Default data structure to prevent flash
  const displayReport = report || {
    team_name: '',
    total_employees: 0,
    total_hours: 0,
    average_hours_per_employee: 0,
    period_start: new Date().toISOString(),
    period_end: new Date().toISOString(),
    weekly_reports: [],
    daily_reports: [],
    advanced_kpis: null,
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports d'équipe</h1>
          <p className="text-muted-foreground mt-1">
            {displayReport.team_name || 'Analyse des performances'}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!report || allReports.isLoading}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exporter en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Exporter en Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON}>
                <Download className="w-4 h-4 mr-2" />
                Exporter en JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Always show content, use displayReport instead of report */}
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayReport.total_employees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures Totales</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayReport.total_hours.toFixed(1)}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne par Employé</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayReport.average_hours_per_employee.toFixed(1)}h
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
                {new Date(displayReport.period_start).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short'
                })}
                {' - '}
                {new Date(displayReport.period_end).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced KPIs Section */}
          {displayReport.advanced_kpis && (
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
                          {displayReport.advanced_kpis.attendance_rate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Taux de présence</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {displayReport.advanced_kpis.total_days_worked} / {displayReport.advanced_kpis.total_workdays * displayReport.total_employees} jours-employés
                      </p>
                    </div>

                    {/* Active Today */}
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">
                          {displayReport.advanced_kpis.active_employees_today}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Actifs aujourd'hui</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        sur {displayReport.total_employees} employés
                      </p>
                    </div>

                    {/* Average Check-in Time */}
                    <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
                      <div className="flex items-center justify-between mb-2">
                        <AlarmClock className="w-5 h-5 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-700">
                          {displayReport.advanced_kpis.average_check_in_time || '-'}
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
                          {displayReport.advanced_kpis.punctuality_rate.toFixed(1)}%
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
                          {displayReport.advanced_kpis.late_arrivals}
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
                          {displayReport.advanced_kpis.overtime_hours.toFixed(1)}h
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
                          {displayReport.advanced_kpis.total_workdays}
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
                          {displayReport.advanced_kpis.total_days_worked}
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
          {displayReport.weekly_reports && displayReport.weekly_reports.length > 0 && (
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
                      {displayReport.weekly_reports.map((weeklyReport, index) => (
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
          {displayReport.daily_reports && displayReport.daily_reports.length > 0 && (
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
                      {displayReport.daily_reports.slice(0, 20).map((dailyReport, index) => (
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
                {displayReport.daily_reports.length > 20 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Affichage de 20 sur {displayReport.daily_reports.length} enregistrements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No data message */}
          {(!displayReport.daily_reports || displayReport.daily_reports.length === 0) &&
            (!displayReport.weekly_reports || displayReport.weekly_reports.length === 0) && (
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
    </div>
  );
}
