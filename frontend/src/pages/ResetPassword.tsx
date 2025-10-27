import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/auth';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import TimeFlowLogo from '@/assets/Logo.svg?react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast.error('Token manquant');
        navigate('/login');
        return;
      }

      try {
        const result = await authApi.verifyResetToken(token);
        if (result.valid) {
          setTokenValid(true);
          setUserEmail(result.email);
          setFirstName(result.first_name);
        } else {
          toast.error('Token invalide ou expiré');
          navigate('/login');
        }
      } catch (error: unknown) {
        console.error('Token verification error:', error);
        const errorMessage = error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Token invalide ou expiré';
        toast.error(errorMessage || 'Token invalide ou expiré');
        navigate('/login');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      toast.error('Token manquant');
      return;
    }

    setSubmitting(true);

    try {
      await authApi.resetPassword(token, password);
      toast.success('Mot de passe réinitialisé avec succès !');

      // Redirect to dashboard after successful reset (user is auto-logged in)
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Erreur lors de la réinitialisation';
      toast.error(errorMessage || 'Erreur lors de la réinitialisation');
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-1">
              <TimeFlowLogo className="w-12 h-12" />
              <h1 className="text-3xl font-bold tracking-tight">TimeFlow</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Gérez votre temps efficacement
            </p>
          </div>

          {/* Loading Card */}
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 animate-spin mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Vérification du token...</p>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center mt-8 text-sm text-muted-foreground">
            © 2025 TimeFlow. Tous droits réservés.
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-1">
            <TimeFlowLogo className="w-12 h-12" />
            <h1 className="text-3xl font-bold tracking-tight">TimeFlow</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Gérez votre temps efficacement
          </p>
        </div>

        {/* Reset Password Card */}
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Définir votre mot de passe</CardTitle>
            <CardDescription className="text-center">
              Bonjour <strong>{firstName}</strong> ({userEmail})
            </CardDescription>
            <p className="text-sm text-muted-foreground text-center pt-2">
              Choisissez un mot de passe sécurisé pour votre compte
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    required
                    minLength={6}
                    disabled={submitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {password && password.length < 6 && (
                  <p className="text-xs text-destructive">Minimum 6 caractères</p>
                )}
              </div>

              {/* Confirm password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    required
                    minLength={6}
                    disabled={submitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={submitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || password.length < 6 || password !== confirmPassword}
                variant="outline"
                size="sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Réinitialisation...
                  </>
                ) : (
                  'Définir le mot de passe'
                )}
              </Button>
            </form>

            {/* Back to login */}
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                disabled={submitting}
                className="text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-muted-foreground">
          © 2025 TimeFlow. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
