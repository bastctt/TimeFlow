import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

// hooks
import { useEmployees } from '@/hooks/useUsers';
import { useCreateEmployee, useUpdateUser, useDeleteUser } from '@/hooks/mutations/useUserMutations';

// types
import type { User, CreateEmployeeData, UpdateEmployeeData } from '@/types/user';

// context
import { useAuth } from '@/context/AuthContext';

// sonner
import { toast } from 'sonner';

// icons
import { Users as UsersIcon, Trash2, Edit, Plus, Mail, Eye, EyeOff } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Queries
  const { data: users = [], isLoading: loading } = useEmployees();

  // Mutations
  const createEmployee = useCreateEmployee();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        first_name: user.first_name,
        last_name: user.last_name,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      if (editingUser) {
        // Update employee
        const updateData: UpdateEmployeeData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        };
        await updateUser.mutateAsync({ id: editingUser.id, data: updateData });
      } else {
        // Create employee
        await createEmployee.mutateAsync(formData);
      }

      handleCloseModal();
    } catch (err) {
      console.error(err)
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      await deleteUser.mutateAsync(userId);
    } catch (err) {
      console.error(err)
    }
  };

  if (!currentUser || currentUser.role !== 'Manager') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Vous n'avez pas accès à cette page. Seuls les managers peuvent gérer les utilisateurs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const formLoading = createEmployee.isPending || updateUser.isPending;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les comptes de vos employés
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2" variant="outline" size={"sm"}>
          <Plus className="w-4 h-4" />
          Nouvel employé
        </Button>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun employé créé</p>
            <Button onClick={() => handleOpenModal()} variant="outline" className="mt-4" size={"sm"}>
              Créer le premier employé
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {user.first_name} {user.last_name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleOpenModal(user)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    onClick={() => handleDelete(user.id)}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier un employé' : 'Créer un nouvel employé'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifiez les informations de l\'employé'
                : 'Remplissez le formulaire pour créer un nouveau compte employé'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Jean"
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Dupont"
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemple@email.com"
                required
                disabled={formLoading}
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    disabled={formLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={formLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                size={"sm"}
                onClick={handleCloseModal}
                disabled={formLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={formLoading} variant={"outline"} size={"sm"}>
                {formLoading
                  ? 'Enregistrement...'
                  : editingUser
                  ? 'Mettre à jour'
                  : 'Créer l\'employé'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
