import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useClock } from '@/context/ClockContext';
import { clocksApi } from '@/services/clocks';
import type { ClockStatus } from '@/types/clock';
import { toast } from 'sonner';

// icons
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClockButton() {
  const { user } = useAuth();
  const { notifyClockChange } = useClock();
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const data = await clocksApi.getStatus();
      setStatus(data);
    } catch (err: unknown) {
      console.error('Error loading clock status:', err);
    }
  };

  const handleClock = async () => {
    if (!status) return;

    try {
      setLoading(true);

      const newStatus = status.is_clocked_in ? 'check-out' : 'check-in';

      await clocksApi.clockIn({ status: newStatus });

      toast.success(
        newStatus === 'check-in'
          ? 'Pointage d\'arrivée enregistré !'
          : 'Pointage de départ enregistré !'
      );

      // Reload status
      await loadStatus();

      // Notify other components of the change
      notifyClockChange();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Erreur lors du pointage');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !status) {
    return null;
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

  // Check if we already have a complete session today (check-out done)
  const hasCompletedSessionToday = !isClockedIn && status.last_clock &&
    status.last_clock.status === 'check-out' &&
    new Date(status.last_clock.clock_time).toDateString() === new Date().toDateString();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pointage
        </CardTitle>
        <CardDescription>
          {hasCompletedSessionToday
            ? `Session terminée à ${lastClockTime}`
            : isClockedIn
              ? `Vous êtes pointé depuis ${lastClockTime}`
              : lastClockTime
                ? `Dernier pointage de départ : ${lastClockTime}`
                : 'Aucun pointage aujourd\'hui'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleClock}
          disabled={loading || hasCompletedSessionToday}
          className={`w-full ${
            hasCompletedSessionToday
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
              : isClockedIn
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
          }`}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Chargement...
            </>
          ) : hasCompletedSessionToday ? (
            <>
              <Clock className="w-5 h-5 mr-2" />
              Session déjà pointée
            </>
          ) : isClockedIn ? (
            <>
              <LogOut className="w-5 h-5 mr-2" />
              Pointer la sortie
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Pointer l'arrivée
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className={`w-3 h-3 rounded-full ${hasCompletedSessionToday ? 'bg-blue-500' : isClockedIn ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{hasCompletedSessionToday ? 'Session terminée' : isClockedIn ? 'Présent' : 'Absent'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
