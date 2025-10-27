import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// icons
import { Calendar, FileText, Loader2 } from 'lucide-react';

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCreateAbsence } from '@/hooks/mutations/useAbsenceMutations';

interface AbsenceDeclarationModalProps {
  open: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD format
}

const absenceTypes = [
  { value: 'sick', label: 'Maladie' },
  { value: 'vacation', label: 'Congé' },
  { value: 'personal', label: 'Personnel' },
  { value: 'other', label: 'Autre' },
] as const;

export default function AbsenceDeclarationModal({
  open,
  onClose,
  date,
}: AbsenceDeclarationModalProps) {
  const [type, setType] = useState<'sick' | 'vacation' | 'personal' | 'other'>('other');
  const [reason, setReason] = useState('');

  const createAbsenceMutation = useCreateAbsence();

  const handleSubmit = () => {
    createAbsenceMutation.mutate(
      { date, type, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          // Reset form
          setType('other');
          setReason('');
          onClose();
        },
      }
    );
  };

  const formattedDate = date ? format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr }) : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="absence-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            Déclarer une absence
          </DialogTitle>
          <DialogDescription id="absence-dialog-description">
            Déclarez votre absence pour le <strong>{formattedDate}</strong>. Votre demande sera
            soumise à validation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" role="form" aria-label="Formulaire de déclaration d'absence">
          {/* Type selection */}
          <div className="space-y-2">
            <Label htmlFor="absence-type">Type d&apos;absence *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'sick' | 'vacation' | 'personal' | 'other')}
            >
              <SelectTrigger
                id="absence-type"
                aria-label="Sélectionner un type d'absence"
                aria-required="true"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {absenceTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason textarea */}
          <div className="space-y-2">
            <Label htmlFor="absence-reason" className="flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              Raison (optionnelle)
            </Label>
            <Textarea
              id="absence-reason"
              placeholder="Décrivez brièvement la raison de votre absence..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
              aria-describedby="char-count"
              aria-label="Raison de l'absence"
            />
            <p id="char-count" className="text-xs text-muted-foreground" aria-live="polite">
              {reason.length}/500 caractères
            </p>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" role="note" aria-label="Information importante">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Votre demande d'absence sera en attente d'approbation par
              votre manager. Vous serez notifié une fois qu'elle sera validée ou refusée.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size={"sm"}
            variant="outline"
            onClick={onClose}
            disabled={createAbsenceMutation.isPending}
            aria-label="Annuler la déclaration d'absence"
          >
            Annuler
          </Button>
          <Button
            size={"sm"}
            onClick={handleSubmit}
            disabled={createAbsenceMutation.isPending}
            aria-label="Soumettre la déclaration d'absence"
            aria-busy={createAbsenceMutation.isPending}
          >
            {createAbsenceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Déclaration...
              </>
            ) : (
              'Déclarer l\'absence'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
