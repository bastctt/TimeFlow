import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePotentialAbsences, useMyAbsences } from '@/hooks/useAbsences';
import type { Absence } from '@/types/absence';

// icons
import { AlertTriangle, Calendar, CheckCircle2, Loader2, Clock, Ban } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import AbsenceDeclarationModal from './AbsenceDeclarationModal';

export default function AbsenceManager() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

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

  const { data: potentialAbsencesData, isLoading: isLoadingPotential } = usePotentialAbsences(
    dateRange.start,
    dateRange.end
  );
  const { data: myAbsences = [], isLoading: isLoadingAbsences } = useMyAbsences(
    dateRange.start,
    dateRange.end
  );

  const handleDeclareAbsence = (date: string) => {
    setSelectedDate(date);
    setModalOpen(true);
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

  const isLoading = isLoadingPotential || isLoadingAbsences;

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gestion des absences
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const potentialAbsences = potentialAbsencesData?.potential_absences || [];
  const totalIssues = potentialAbsences.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Gestion des absences
        </CardTitle>
        <CardDescription>
          Période : {new Date(dateRange.start).toLocaleDateString('fr-FR')} -{' '}
          {new Date(dateRange.end).toLocaleDateString('fr-FR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Summary */}
        {totalIssues === 0 ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Aucun problème détecté ! Tous vos pointages sont complets.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {totalIssues} problème{totalIssues > 1 ? 's' : ''} détecté{totalIssues > 1 ? 's' : ''}
            </AlertDescription>
          </Alert>
        )}

        {/* Declared absences */}
        {myAbsences.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">
                Absences déclarées ({myAbsences.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {myAbsences.map((absence) => (
                <div
                  key={absence.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    absence.status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : absence.status === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {new Date(absence.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      {getStatusBadge(absence)}
                    </div>
                    {absence.reason && (
                      <p className="text-xs text-muted-foreground italic">
                        Raison: {absence.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential absences (days without clocks or absences) */}
        {potentialAbsences.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">
                Jours sans pointage ({potentialAbsences.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {potentialAbsences.map((date) => {
                return (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        Aucun pointage
                      </Badge>
                      <span className="text-sm font-medium">
                        {new Date(date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclareAbsence(date)}
                    >
                      Déclarer
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Ces jours ouvrables n'ont aucun pointage. Marquez-les comme absence si vous étiez absent.
            </p>
          </div>
        )}
      </CardContent>

      <AbsenceDeclarationModal open={modalOpen} onClose={() => setModalOpen(false)} date={selectedDate} />
    </Card>
  );
}
