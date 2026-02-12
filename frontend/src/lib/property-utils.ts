export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  villa: 'Villa',
  room: 'Quarto',
  studio: 'Studio',
};

export const CANCELLATION_POLICY_LABELS: Record<string, string> = {
  flexible: 'Flexível',
  moderate: 'Moderada',
  strict: 'Rigorosa',
};

export const BOOKING_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmada', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  completed: { label: 'Concluída', variant: 'outline' },
};
