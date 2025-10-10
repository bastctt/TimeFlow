import { Link } from 'react-router-dom';

// icons
import { Home, AlertCircle } from 'lucide-react';

// ui
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center shadow-2xl">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="w-12 h-12 text-destructive-foreground" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-7xl font-bold text-foreground">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-foreground">Page non trouvée</h2>
              <p className="text-muted-foreground text-sm">
                Oups! La page que vous recherchez n'existe pas ou a été déplacée.
              </p>
            </div>

            <div className="pt-4">
              <Link to="/dashboard">
                <Button
                  className="flex items-center justify-center gap-2 w-full"
                >
                  <Home className="w-5 h-5" />
                  Retour au tableau de bord
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
