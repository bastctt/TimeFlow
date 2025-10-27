import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

// context
import { useAuth } from '@/context/AuthContext';

// hooks
import { useUpdateUser, useDeleteUser } from '@/hooks/mutations/useUserMutations';

// icons
import { AlertCircle, User, Briefcase, Trash2 } from 'lucide-react';

// shadcn/ui components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { user, updateUser: updateAuthUser, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'Employé'
  });

  // Mutations
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        }
      });

      // Update auth context
      await updateAuthUser(formData);
    } catch (err) {
      console.error(err)
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmMessage = 'Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.';
    if (!confirm(confirmMessage)) {
      return;
    }

    const doubleConfirm = confirm('Dernière confirmation : voulez-vous vraiment supprimer définitivement votre compte ?');
    if (!doubleConfirm) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      logout();
      navigate('/login');
    } catch (err) {
      console.error(err)
    }
  };

  if (!user) return null;

  const loading = updateUser.isPending;
  const deleteLoading = deleteUser.isPending;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground"
          aria-hidden="true"
        >
          {user.first_name[0]}{user.last_name[0]}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
          <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
        </div>
      </header>

      {/* Profile Form */}
      <Card role="region" aria-labelledby="profile-info-title">
        <CardHeader>
          <CardTitle id="profile-info-title" className="flex items-center gap-2">
            <User className="w-5 h-5" aria-hidden="true" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations de profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulaire de modification du profil">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  minLength={2}
                  disabled={user.role === 'Employé'}
                  aria-required="true"
                  aria-disabled={user.role === 'Employé'}
                  aria-describedby={user.role === 'Employé' ? 'employee-restriction' : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  minLength={2}
                  disabled={user.role === 'Employé'}
                  aria-required="true"
                  aria-disabled={user.role === 'Employé'}
                  aria-describedby={user.role === 'Employé' ? 'employee-restriction' : undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={user.role === 'Employé'}
                aria-required="true"
                aria-disabled={user.role === 'Employé'}
                aria-describedby={user.role === 'Employé' ? 'employee-restriction' : undefined}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: string) => setFormData({ ...formData, role: value as 'Manager' | 'Employé' })}
                disabled={user.role === 'Employé'}
              >
                <SelectTrigger
                  id="role"
                  aria-label="Sélectionner un rôle"
                  aria-disabled={user.role === 'Employé'}
                  aria-describedby={user.role === 'Employé' ? 'role-restriction' : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employé">Employé</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              {user.role === 'Employé' && (
                <p id="role-restriction" className="text-xs text-muted-foreground">
                  Seul un manager peut modifier ce champ
                </p>
              )}
            </div>

            {user.role === 'Employé' && (
              <p id="employee-restriction" className="sr-only">
                Les employés ne peuvent pas modifier leurs informations personnelles. Contactez un manager pour effectuer des modifications.
              </p>
            )}

            {user.role !== 'Employé' && (
              <>
                <Alert role="alert">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  <AlertDescription>
                    La modification de votre email ou rôle peut nécessiter une nouvelle connexion.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4 pt-4 justify-center">
                  <Button
                    type="submit"
                    disabled={loading}
                    variant={"outline"}
                    size={"sm"}
                    aria-busy={loading}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size={"sm"}
                    disabled={loading}
                    onClick={() => {
                      if (user) {
                        setFormData({
                          email: user.email,
                          first_name: user.first_name,
                          last_name: user.last_name,
                          role: user.role
                        });
                      }
                    }}
                    aria-label="Réinitialiser le formulaire aux valeurs originales"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card role="region" aria-labelledby="account-info-title">
        <CardHeader>
          <CardTitle id="account-info-title" className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" aria-hidden="true" />
            Informations du compte
          </CardTitle>
          <CardDescription>
            Détails de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <dt className="text-sm text-muted-foreground">ID Utilisateur</dt>
              <dd className="font-semibold">#{user.id}</dd>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <dt className="text-sm text-muted-foreground">Statut du compte</dt>
              <dd>
                <Badge variant="secondary" aria-label="Statut du compte: Actif">
                  Actif
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between items-center py-3">
              <dt className="text-sm text-muted-foreground">Rôle actuel</dt>
              <dd>
                <Badge variant={user.role === 'Manager' ? 'default' : 'secondary'} aria-label={`Rôle actuel: ${user.role}`}>
                  {user.role}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive" role="region" aria-labelledby="danger-zone-title">
        <CardHeader>
          <CardTitle id="danger-zone-title" className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" aria-hidden="true" />
            Zone dangereuse
          </CardTitle>
          <CardDescription>
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <AlertDescription>
              La suppression de votre compte est <strong>permanente et irréversible</strong>.
              Toutes vos données seront définitivement supprimées.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            size={"sm"}
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="w-full sm:w-auto"
            aria-label="Supprimer définitivement mon compte"
            aria-busy={deleteLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
            {deleteLoading ? 'Suppression en cours...' : 'Supprimer mon compte'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
