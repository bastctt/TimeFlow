import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { clocksApi } from '@/services/clocks';
import type { ClockStatus } from '@/types/clock';

// icons
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClockButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const data = await clocksApi.getStatus();
      setStatus(data);
    } catch (err: any) {
      console.error('Error loading clock status:', err);
    }
  };

  const handleClock = async () => {
    if (!status) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const newStatus = status.is_clocked_in ? 'check-out' : 'check-in';

      await clocksApi.clockIn({ status: newStatus });

      setSuccess(
        newStatus === 'check-in'
          ? 'Pointage d\'arrivée enregistré !'
          : 'Pointage de départ enregistré !'
      );

      // Reload status
      await loadStatus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du pointage');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pointage
        </CardTitle>
        <CardDescription>
          {isClockedIn
            ? `Vous êtes pointé depuis ${lastClockTime}`
            : lastClockTime
              ? `Dernier pointage de départ : ${lastClockTime}`
              : 'Aucun pointage aujourd\'hui'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleClock}
          disabled={loading}
          className={`w-full ${
            isClockedIn
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
          <div className={`w-3 h-3 rounded-full ${isClockedIn ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{isClockedIn ? 'Présent' : 'Absent'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
