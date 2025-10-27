import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// context
import { useAuth } from '@/context/AuthContext';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import TimeFlowLogo from '@/assets/Logo.svg?react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <header className="flex flex-col items-center mb-8" role="banner">
          <div className="flex items-center gap-1">
            <TimeFlowLogo className="w-12 h-12" aria-hidden="true" />
            <h1 className="text-3xl font-bold tracking-tight">TimeFlow</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Gérez votre temps efficacement
          </p>
        </header>

        {/* Login Card */}
        <Card role="main" aria-labelledby="login-title">
          <CardHeader className="space-y-1">
            <CardTitle id="login-title" className="text-2xl font-bold text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire de connexion">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  disabled={loading}
                  aria-required="true"
                  aria-invalid={email && !email.includes('@') ? 'true' : 'false'}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    disabled={loading}
                    aria-label="Mot de passe oublié ? Réinitialiser votre mot de passe"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    disabled={loading}
                    className="pr-10"
                    aria-required="true"
                    aria-invalid={password && password.length < 6 ? 'true' : 'false'}
                    aria-describedby="password-requirements"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <p id="password-requirements" className="sr-only">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                variant={"outline"}
                size={"sm"}
                aria-busy={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-muted-foreground" role="contentinfo">
          © 2025 TimeFlow. Tous droits réservés.
        </footer>
      </div>
    </div>
  );
}
