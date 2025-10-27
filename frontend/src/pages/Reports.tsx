import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAllReportPeriods } from '@/hooks/useReports';
import { useTeamAbsences } from '@/hooks/useAbsences';
import { toast } from 'sonner';

// utils
import { formatHoursToHHMM } from '@/lib/utils';

// icons
import { BarChart3, Calendar, Clock, TrendingUp, Users, Download, Target, UserCheck, AlarmClock, Zap, Award, AlertTriangle, XCircle, UserX } from 'lucide-react';

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
// import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
// import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('week');

  // Load all report periods at once
  const allReports = useAllReportPeriods();

  // Get the current report based on selected period
  const report = period === 'week' ? allReports.week : period === 'month' ? allReports.month : allReports.custom;
  const loading = allReports.isLoading;

  // Calculate date range for absences based on period
  const absencesDateRange = useMemo(() => {
    if (!report) return { start: undefined, end: undefined };
    return {
      start: report.period_start,
      end: report.period_end,
    };
  }, [report]);

  // Get team absences for the selected period
  const { data: teamAbsences = [] } = useTeamAbsences(
    absencesDateRange.start,
    absencesDateRange.end
  );

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
          csv += `${formatHoursToHHMM(dr.hours_worked)}\n`;
        });
      }

      // Add weekly reports
      if (report.weekly_reports && report.weekly_reports.length > 0) {
        report.weekly_reports.forEach(wr => {
          csv += `Hebdomadaire,"${wr.first_name} ${wr.last_name}","${wr.email}",`;
          csv += `"${new Date(wr.week_start).toLocaleDateString('fr-FR')} - ${new Date(wr.week_end).toLocaleDateString('fr-FR')}",`;
          csv += `-,-,${formatHoursToHHMM(wr.total_hours)}\n`;
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
          html += `<td>${formatHoursToHHMM(dr.hours_worked)}</td>`;
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
          html += `<td>${formatHoursToHHMM(wr.total_hours)}</td>`;
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

  // Show loading state while data is being fetched (same pattern as Users.tsx)
  if (loading || !report) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement...</p>
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
            {report.team_name}
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
              <Button variant="outline" size="sm" disabled={!report}>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total employés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.total_employees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures totales</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHoursToHHMM(report.total_hours)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne par employé</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHoursToHHMM(report.average_hours_per_employee)}
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
                          {formatHoursToHHMM(report.advanced_kpis.overtime_hours)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Heures supp.</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Au-delà de 8h/jour
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

                    {/* Incomplete Sessions (excluding today) */}
                    <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="flex items-center justify-between mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-2xl font-bold text-red-700">
                          {(() => {
                            const today = new Date().toISOString().split('T')[0];
                            return report.daily_reports?.filter((dr) => {
                              // Only count as incomplete if:
                              // 1. Missing checkout is true
                              // 2. AND the date is before today
                              return dr.missing_checkout && dr.date < today;
                            }).length || 0;
                          })()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">Sessions incomplètes</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Check-out manquants (passés)
                      </p>
                    </div>

                    {/* Absences */}
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-2">
                        <UserX className="w-5 h-5 text-gray-600" />
                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {teamAbsences.length}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Absences</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Jours d'absence déclarés
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts Section - Commented for now */}
              {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"> */}
                {/* Chart 1: Daily Attendance Rate */}
                {/* {report.daily_reports && report.daily_reports.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        Taux de présence quotidien
                      </CardTitle>
                      <CardDescription>Évolution jour par jour sur la période</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          rate: {
                            label: "Taux de présence",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <LineChart
                          data={(() => {
                            // Group by date and calculate attendance rate
                            const dateMap = report.daily_reports.reduce((acc: Record<string, { present: number; total: number }>, dr) => {
                              const date = dr.date;
                              if (!acc[date]) {
                                acc[date] = { present: 0, total: 0 };
                              }
                              acc[date].total += 1;
                              if (dr.check_in) {
                                acc[date].present += 1;
                              }
                              return acc;
                            }, {});

                            return Object.entries(dateMap)
                              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                              .map(([date, data]) => ({
                                date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                                rate: Math.round((data.present / data.total) * 100),
                              }));
                          })()}
                          margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value: number) => [`${value}%`, "Présence"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: "#3b82f6", r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )} */}

                {/* Chart 2: Overtime Hours by Employee */}
                {/* {report.daily_reports && report.daily_reports.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Heures supplémentaires
                      </CardTitle>
                      <CardDescription>Total par employé (au-delà de 8h/jour)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          overtime: {
                            label: "Heures supp.",
                            color: "hsl(var(--chart-4))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <BarChart
                          data={(() => {
                            // Calculate overtime by employee
                            const employeeOvertime = report.daily_reports.reduce((acc: Record<string, { name: string; overtime: number }>, dr) => {
                              const key = `${dr.first_name} ${dr.last_name}`;
                              if (!acc[key]) {
                                acc[key] = { name: key, overtime: 0 };
                              }
                              // Overtime = hours worked beyond 8 hours per day
                              if (dr.hours_worked > 8) {
                                acc[key].overtime += (dr.hours_worked - 8);
                              }
                              return acc;
                            }, {});

                            return Object.values(employeeOvertime)
                              .filter(e => e.overtime > 0) // Only show employees with overtime
                              .sort((a, b) => b.overtime - a.overtime) // Sort by most overtime
                              .map(e => ({
                                name: e.name.split(' ')[0],
                                overtime: parseFloat(e.overtime.toFixed(1)),
                                fullName: e.name,
                              }));
                          })()}
                          margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value: number) => [`${value}h`, "Heures supp."]}
                          />
                          <Bar
                            dataKey="overtime"
                            fill="#6366f1"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )} */}
              {/* </div> */}
            </>
          )}

      {/* No data message - only show when we have real data that is empty */}
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
    </div>
  );
}
