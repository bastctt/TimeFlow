import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { WorkingHours } from '@/types/clock';
import type { Absence } from '@/types/absence';
import { formatHoursToHHMM } from '@/lib/utils';

interface PlanningDayCellProps {
  date: Date;
  dayData?: WorkingHours;
  absence?: Absence | null;
  isLoading?: boolean;
  isEmployee?: boolean;
}

export default function PlanningDayCell({
  date,
  dayData,
  absence,
  isLoading = false,
  isEmployee = true,
}: PlanningDayCellProps) {
  if (isLoading) {
    if (isEmployee) {
      return (
        <div className="w-full p-4 border-2 rounded-lg text-center h-[120px] flex flex-col justify-center bg-muted/30 border-muted-foreground/20">
          <div className="flex items-center justify-center gap-2 text-base font-bold h-[24px] text-muted-foreground">
            <Clock className="w-5 h-5" />
            <span>-</span>
          </div>
          <Separator className="my-2" />
          <div className="text-xs font-medium text-muted-foreground h-[36px] flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 h-[16px]">
              <span>Arrivée:</span>
              <span className="font-bold">--:--</span>
            </div>
            <div className="h-4"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full p-2 rounded-lg text-center h-[70px] flex flex-col justify-center bg-muted/30">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground h-[20px]">
            <Clock className="w-3 h-3" />
            <span>-</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 h-[14px]">--:--</p>
          <div className="h-3"></div>
        </div>
      );
    }
  }

  // Check if day is marked as absent
  if (absence || dayData?.is_absent) {
    const status = absence?.status ?? 'pending';

    if (isEmployee) {
      return (
        <div className={`w-full p-4 border-2 rounded-lg text-center h-[120px] flex flex-col justify-center ${
          status === 'approved'
            ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-400 dark:from-green-900 dark:to-green-800 dark:border-green-600'
            : status === 'rejected'
            ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-400 dark:from-red-900 dark:to-red-800 dark:border-red-600'
            : 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-400 dark:from-orange-900 dark:to-orange-800 dark:border-orange-600'
        }`}>
          <div className={`flex items-center justify-center gap-2 text-base font-bold ${
            status === 'approved'
              ? 'text-green-700 dark:text-green-300'
              : status === 'rejected'
              ? 'text-red-700 dark:text-red-300'
              : 'text-orange-700 dark:text-orange-300'
          }`}>
            <span>Absent</span>
          </div>
          <div className="h-[28px] flex items-center justify-center">
            <Badge variant="outline" className={`mx-auto mt-2 ${
              status === 'approved'
                ? 'border-green-400 text-green-600'
                : status === 'rejected'
                ? 'border-red-400 text-red-600'
                : 'border-orange-400 text-orange-600'
            }`}>
              {status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Refusée' : 'En attente'}
            </Badge>
          </div>
        </div>
      );
    } else {
      return (
        <div className={`w-full p-2 rounded-lg text-center h-[70px] flex flex-col justify-center ${
          status === 'approved'
            ? 'bg-green-100 dark:bg-green-900'
            : status === 'rejected'
            ? 'bg-red-100 dark:bg-red-900'
            : 'bg-orange-100 dark:bg-orange-900'
        }`}>
          <div className={`flex items-center justify-center gap-1 text-sm font-bold ${
            status === 'approved'
              ? 'text-green-700 dark:text-green-300'
              : status === 'rejected'
              ? 'text-red-700 dark:text-red-300'
              : 'text-orange-700 dark:text-orange-300'
          }`}>
            <span>Absent</span>
          </div>
          <p className={`text-[10px] mt-1 h-[14px] ${
            status === 'approved'
              ? 'text-green-600 dark:text-green-400'
              : status === 'rejected'
              ? 'text-red-600 dark:text-red-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Refusée' : 'En attente'}
          </p>
        </div>
      );
    }
  }

  // Check if there's clock data
  if (dayData && dayData.check_in) {
    const hasCheckout = !!dayData.check_out;
    const isPastDay = date < new Date(new Date().setHours(0, 0, 0, 0));
    const isIncompleteSession = !hasCheckout && isPastDay;

    if (isEmployee) {
      return (
        <div className={`w-full p-4 border-2 rounded-lg text-center hover:shadow-md h-[120px] flex flex-col justify-center ${
          hasCheckout
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 dark:from-green-950 dark:to-emerald-950 dark:border-green-800'
            : isIncompleteSession
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300 dark:from-red-950 dark:to-orange-950 dark:border-red-800'
              : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300 dark:from-blue-950 dark:to-sky-950 dark:border-blue-800 animate-pulse'
        }`}>
          <div className={`flex items-center justify-center gap-2 text-base font-bold h-[24px] ${
            hasCheckout
              ? 'text-green-700 dark:text-green-400'
              : isIncompleteSession
                ? 'text-red-700 dark:text-red-400'
                : 'text-blue-700 dark:text-blue-400'
          }`}>
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {hasCheckout
                ? formatHoursToHHMM(dayData.hours_worked)
                : isIncompleteSession
                  ? 'Incomplet'
                  : 'En cours'}
            </span>
          </div>
          <Separator className="my-2" />
          <div className={`text-xs font-medium h-[36px] flex flex-col justify-center ${
            hasCheckout
              ? 'text-green-600 dark:text-green-500'
              : isIncompleteSession
                ? 'text-red-600 dark:text-red-500'
                : 'text-blue-600 dark:text-blue-500'
          }`}>
            <div className="flex items-center justify-center gap-1 h-[16px]">
              <span>Arrivée:</span>
              <span className="font-bold">{new Date(dayData.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {hasCheckout && dayData.check_out ? (
              <div className="flex items-center justify-center gap-1 h-[16px]">
                <span>Départ:</span>
                <span className="font-bold">{new Date(dayData.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ) : (
              <div className="h-4"></div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className={`w-full p-2 rounded-lg text-center h-[70px] flex flex-col justify-center ${
          hasCheckout
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50'
            : isIncompleteSession
              ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50'
              : 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-sky-950/50 animate-pulse'
        }`}>
          <div className={`flex items-center justify-center gap-1 text-sm font-bold h-[20px] ${
            hasCheckout
              ? 'text-green-700 dark:text-green-400'
              : isIncompleteSession
                ? 'text-red-700 dark:text-red-400'
                : 'text-blue-700 dark:text-blue-400'
          }`}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {hasCheckout
                ? formatHoursToHHMM(dayData.hours_worked)
                : isIncompleteSession
                  ? 'Incomplet'
                  : 'En cours'}
            </span>
          </div>
          <div className={`text-[10px] mt-1 font-medium h-[30px] flex flex-col justify-center ${
            hasCheckout
              ? 'text-green-600 dark:text-green-500'
              : isIncompleteSession
                ? 'text-red-600 dark:text-red-500'
                : 'text-blue-600 dark:text-blue-500'
          }`}>
            <div className="h-[14px]">{new Date(dayData.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            {hasCheckout && dayData.check_out ? (
              <div className="h-[14px]">→ {new Date(dayData.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            ) : (
              <div className="h-3"></div>
            )}
          </div>
        </div>
      );
    }
  }

  // No data - empty cell
  if (isEmployee) {
    return (
      <div className="w-full p-4 bg-muted/50 rounded-lg text-center border-2 border-dashed border-muted-foreground/20 h-[120px] flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 text-base font-bold h-[24px] text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span>-</span>
        </div>
        <Separator className="my-2" />
        <div className="text-xs font-medium text-muted-foreground h-[36px] flex flex-col justify-center">
          <div className="flex items-center justify-center gap-1 h-[16px]">
            <span>Arrivée:</span>
            <span className="font-bold">-</span>
          </div>
          <div className="h-4"></div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="w-full p-2 rounded-lg bg-muted/30 text-center h-[70px] flex flex-col justify-center">
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground h-[20px]">
          <Clock className="w-3 h-3" />
          <span>-</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 h-[14px]">Non pointé</p>
        <div className="h-3"></div>
      </div>
    );
  }
}
