import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WeekNavigationProps {
  weekDates: Date[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export default function WeekNavigation({
  weekDates,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
}: WeekNavigationProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Button
            onClick={onPreviousWeek}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            Semaine précédente
          </Button>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              onClick={onCurrentWeek}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-initial"
            >
              Aujourd'hui
            </Button>
            <Button
              onClick={onNextWeek}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 flex-1 md:flex-initial"
            >
              Semaine suivante
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
