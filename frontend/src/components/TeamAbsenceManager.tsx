import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTeamAbsences } from '@/hooks/useAbsences';
import { useTeams, useTeamMembers } from '@/hooks/useTeams';
import { useApproveAbsence, useRejectAbsence } from '@/hooks/mutations/useAbsenceMutations';
import type { Absence } from '@/types/absence';

// icons
import { Calendar, CheckCircle2, Clock, Loader2, XCircle, User, Ban } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TeamAbsenceManager() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (selectedPeriod === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      start.setDate(end.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [selectedPeriod]);

  // Get manager's team
  const { data: teams = [] } = useTeams();
  const myTeam = useMemo(() => teams.find(team => team.manager_id === user?.id), [teams, user]);

  const { data: teamAbsences = [], isLoading } = useTeamAbsences(dateRange.start, dateRange.end);
  const { data: teamMembers = [] } = useTeamMembers(myTeam?.id || 0);

  const approveMutation = useApproveAbsence();
  const rejectMutation = useRejectAbsence();

  // Filter absences based on status
  const filteredAbsences = useMemo(() => {
    let filtered = [...teamAbsences];

    if (filterStatus === 'pending') {
      filtered = filtered.filter((a) => a.status === 'pending');
    } else if (filterStatus === 'approved') {
      filtered = filtered.filter((a) => a.status === 'approved');
    } else if (filterStatus === 'rejected') {
      filtered = filtered.filter((a) => a.status === 'rejected');
    }

    // Sort: pending first, then by date desc
    return filtered.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [teamAbsences, filterStatus]);

  const pendingCount = teamAbsences.filter((a) => a.status === 'pending').length;

  const getUserName = (userId: number) => {
    const member = teamMembers.find((m) => m.id === userId);
    return member ? `${member.first_name} ${member.last_name}` : 'Inconnu';
  };

  const getStatusBadge = (absence: Absence) => {
    if (absence.status === 'approved') {
      return (
        <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approuvée
        </Badge>
      );
    } else if (absence.status === 'rejected') {
      return (
        <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
          <Ban className="w-3 h-3 mr-1" />
          Refusée
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sick: 'Maladie',
      vacation: 'Congé',
      personal: 'Personnel',
      other: 'Autre',
    };
    return types[type] || type;
  };

  const handleApprove = (absenceId: number) => {
    if (window.confirm('Approuver cette demande ?')) {
      approveMutation.mutate(absenceId);
    }
  };

  const handleReject = (absenceId: number) => {
    if (window.confirm('Refuser cette demande ?')) {
      rejectMutation.mutate(absenceId);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gestion des absences de l'équipe
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Gestion des absences de l'équipe
        </CardTitle>
        <CardDescription>
          Période : {new Date(dateRange.start).toLocaleDateString('fr-FR')} -{' '}
          {new Date(dateRange.end).toLocaleDateString('fr-FR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Period selector */}
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              7 derniers jours
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              30 derniers jours
            </Button>
          </div>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'pending' | 'approved' | 'rejected')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="pending">En attente ({pendingCount})</SelectItem>
              <SelectItem value="approved">Approuvées</SelectItem>
              <SelectItem value="rejected">Refusées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        {pendingCount > 0 ? (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente de validation
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Aucune demande en attente
            </AlertDescription>
          </Alert>
        )}

        {/* Absences list */}
        {filteredAbsences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune absence pour la période sélectionnée
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">
              Absences ({filteredAbsences.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredAbsences.map((absence) => (
                <div
                  key={absence.id}
                  className={`p-4 border rounded-lg space-y-3 ${
                    absence.status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : absence.status === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  {/* Header: User name and status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{getUserName(absence.user_id)}</span>
                    </div>
                    {getStatusBadge(absence)}
                  </div>

                  {/* Date and type */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(absence.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Type: <span className="font-medium">{getTypeLabel(absence.type)}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  {absence.reason && (
                    <div className="bg-white/50 p-2 rounded border border-current/10">
                      <p className="text-xs text-muted-foreground">
                        <strong>Raison:</strong> {absence.reason}
                      </p>
                    </div>
                  )}

                  {/* Actions (only for pending absences) */}
                  {absence.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
                        onClick={() => handleApprove(absence.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approuver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => handleReject(absence.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Refuser
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
