import { Clock, Shield, BedDouble } from 'lucide-react';
import { CANCELLATION_POLICY_LABELS } from '@/lib/property-utils';

interface PropertyInfoProps {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  minimumNights: number;
}

export function PropertyInfo({ checkInTime, checkOutTime, cancellationPolicy, minimumNights }: PropertyInfoProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Informações</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Check-in: {checkInTime}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Check-out: {checkOutTime}
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />
          Cancelamento: {CANCELLATION_POLICY_LABELS[cancellationPolicy]}
        </div>
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-gray-400" />
          Mínimo {minimumNights} noites
        </div>
      </div>
    </div>
  );
}
