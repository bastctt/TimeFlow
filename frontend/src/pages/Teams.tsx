import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

// services
import { teamsApi } from '@/services/teams';

// types
import type { Team, TeamCreate, TeamMember } from '@/types/team';

// context
import { useAuth } from '@/context/AuthContext';

// icons
import { Users, Plus, Edit2, Trash2, UserCheck } from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingMembers, setViewingMembers] = useState<TeamMember[] | null>(null);
  const [viewingTeamName, setViewingTeamName] = useState('');

  const [formData, setFormData] = useState<TeamCreate>({
    name: '',
    description: '',
    manager_id: user?.id || 0
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamsApi.getAll();
      setTeams(data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des équipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingTeam) {
        await teamsApi.update(editingTeam.id, formData);
        setSuccess('Équipe mise à jour avec succès');
      } else {
        await teamsApi.create(formData);
        setSuccess('Équipe créée avec succès');
      }

      setShowModal(false);
      setEditingTeam(null);
      resetForm();
      loadTeams();
    } catch (err) {
      setError('Une erreur est survenue');
      console.error(err);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      manager_id: team.manager_id || user?.id || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return;

    try {
      await teamsApi.delete(id);
      setSuccess('Équipe supprimée avec succès');
      loadTeams();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const handleViewMembers = async (team: Team) => {
    try {
      const members = await teamsApi.getMembers(team.id);
      setViewingMembers(members);
      setViewingTeamName(team.name);
    } catch (err) {
      setError('Erreur lors du chargement des membres');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      manager_id: user?.id || 0
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingTeam(null);
    setShowModal(true);
  };

  if (!user || user.role !== 'Manager') {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive">
          <AlertDescription>Accès refusé : réservé aux Managers</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des équipes</h1>
          <p className="text-muted-foreground mt-1">Gérez vos équipes et leurs membres</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2" variant={"outline"} size={"sm"}>
          <Plus className="w-4 h-4" />
          Nouvelle équipe
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Teams Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Aucune équipe pour le moment</p>
            <Button onClick={openCreateModal} variant={"outline"} size={"sm"}>
              Créer une équipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>ID: #{team.id}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewMembers(team)}
                    className="flex-1"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Membres
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(team)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe'}</DialogTitle>
            <DialogDescription>
              {editingTeam ? 'Modifiez les informations de l\'équipe' : 'Créez une nouvelle équipe pour votre organisation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'équipe</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Équipe Développement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Description de l'équipe..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                size={"sm"}
                onClick={() => {
                  setShowModal(false);
                  setEditingTeam(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button type="submit" variant={"outline"} size={"sm"}>
                {editingTeam ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={!!viewingMembers} onOpenChange={() => {
        setViewingMembers(null);
        setViewingTeamName('');
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membres de {viewingTeamName}</DialogTitle>
            <DialogDescription>
              Liste des membres de cette équipe
            </DialogDescription>
          </DialogHeader>
          {viewingMembers && viewingMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun membre dans cette équipe</p>
          ) : (
            <div className="space-y-2">
              {viewingMembers?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant={member.role === 'Manager' ? 'default' : 'secondary'}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
