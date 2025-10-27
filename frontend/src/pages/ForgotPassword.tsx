import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/auth';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import TimeFlowLogo from '@/assets/Logo.svg?react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    setSubmitting(true);

    try {
      const result = await authApi.requestPasswordReset(email);
      toast.success(result.message);
      setEmailSent(true);
    } catch (error) {
      console.error('Request password reset error:', error);
      // Always show success to prevent email enumeration
      toast.success('Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.');
      setEmailSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
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

          {/* Success Card */}
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Email envoyé !</CardTitle>
              <CardDescription className="text-center">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Le lien est valide pendant 24 heures.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
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

        {/* Forgot Password Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Mot de passe oublié ?</CardTitle>
            <CardDescription className="text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting} variant="outline" size="sm">
                {submitting ? (
                  <>
                    <Mail className="w-4 h-4 mr-2 animate-pulse" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer le lien
                  </>
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
