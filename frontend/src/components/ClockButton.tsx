import { useAuth } from '@/context/AuthContext';
import { useClockStatus } from '@/hooks/useClocks';
import { useClockInOut } from '@/hooks/mutations/useClockMutations';
import { toast } from 'sonner';

// icons
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClockButton() {
  const { user } = useAuth();
  const { data: status, isLoading: isLoadingStatus } = useClockStatus();
  const clockMutation = useClockInOut();

  const handleClock = async () => {
    if (!status) return;

    const newStatus = status.is_clocked_in ? 'check-out' : 'check-in';

    clockMutation.mutate(
      { status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'check-in'
              ? 'Pointage d\'arrivée enregistré !'
              : 'Pointage de départ enregistré !'
          );
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { error?: string } } };
          toast.error(error?.response?.data?.error || 'Erreur lors du pointage');
        },
      }
    );
  };

  if (!user) {
    return null;
  }

  // Show skeleton while loading for the first time
  if (isLoadingStatus || !status) {
    return (
      <Card role="region" aria-label="Pointage" aria-busy="true">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" aria-hidden="true" />
            Pointage
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button disabled className="w-full" size="sm" aria-label="Chargement du statut de pointage">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
            Chargement...
          </Button>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-gray-400" role="status" aria-label="Statut en cours de chargement" />
            <span>Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isClockedIn = status.is_clocked_in;
  const lastClockTime = status.last_clock
    ? new Date(status.last_clock.clock_time).toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      })
    : null;

  // Check if we already have a complete session today (check-out done today)
  const hasCompletedSessionToday = !isClockedIn && status.last_clock &&
    status.last_clock.status === 'check-out' &&
    new Date(status.last_clock.clock_time).toDateString() === new Date().toDateString();

  // Check if last clock is from a previous day (expired session)
  const isExpiredSession = status.last_clock &&
    status.last_clock.status === 'check-in' &&
    new Date(status.last_clock.clock_time).toDateString() !== new Date().toDateString();

  const statusMessage = isExpiredSession
    ? `⚠️ Session incomplète du ${lastClockTime} - Veuillez pointer l'arrivée pour aujourd'hui`
    : hasCompletedSessionToday
      ? `Session terminée à ${lastClockTime}`
      : isClockedIn
        ? `Vous êtes pointé depuis ${lastClockTime}`
        : lastClockTime
          ? `Dernier pointage de départ : ${lastClockTime}`
          : 'Aucun pointage aujourd\'hui';

  const buttonLabel = clockMutation.isPending
    ? 'Enregistrement du pointage en cours'
    : hasCompletedSessionToday
      ? 'Session déjà pointée pour aujourd\'hui'
      : isExpiredSession
        ? 'Pointer l\'arrivée pour démarrer une nouvelle session'
        : isClockedIn
          ? 'Pointer la sortie pour terminer la session en cours'
          : 'Pointer l\'arrivée pour démarrer la session';

  const currentStatus = hasCompletedSessionToday
    ? 'Session terminée'
    : isExpiredSession
      ? 'Session incomplète'
      : isClockedIn
        ? 'Présent'
        : 'Absent';

  return (
    <Card role="region" aria-labelledby="clock-title" aria-live="polite">
      <CardHeader>
        <CardTitle id="clock-title" className="flex items-center gap-2">
          <Clock className="w-5 h-5" aria-hidden="true" />
          Pointage
        </CardTitle>
        <CardDescription id="clock-status">
          {statusMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleClock}
          disabled={clockMutation.isPending || !!hasCompletedSessionToday}
          className={`w-full ${
            hasCompletedSessionToday
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
              : isExpiredSession
                ? 'bg-orange-500 hover:bg-orange-600'
                : isClockedIn
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
          }`}
          size="sm"
          aria-label={buttonLabel}
          aria-busy={clockMutation.isPending}
          aria-describedby="clock-status"
        >
          {clockMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
              Chargement...
            </>
          ) : hasCompletedSessionToday ? (
            <>
              <Clock className="w-5 h-5 mr-2" aria-hidden="true" />
              Session déjà pointée
            </>
          ) : isExpiredSession ? (
            <>
              <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
              Pointer l'arrivée (nouvelle session)
            </>
          ) : isClockedIn ? (
            <>
              <LogOut className="w-5 h-5 mr-2" aria-hidden="true" />
              Pointer la sortie
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
              Pointer l'arrivée
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-label={`Statut actuel: ${currentStatus}`}>
          <div
            className={`w-3 h-3 rounded-full ${hasCompletedSessionToday ? 'bg-blue-500' : isExpiredSession ? 'bg-orange-500' : isClockedIn ? 'bg-green-500' : 'bg-gray-400'}`}
            aria-hidden="true"
          />
          <span>{currentStatus}</span>
        </div>
      </CardContent>
    </Card>
  );
}
