'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Booking } from '@/lib/types';
import { BOOKING_STATUS_CONFIG } from '@/lib/property-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarDays, Users, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';

const statusIconMap: Record<string, typeof CheckCircle> = {
  pending: Clock,
  confirmed: CheckCircle,
  cancelled: XCircle,
  completed: CheckCircle,
};

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    api.bookings
      .get(id)
      .then((res) => setBooking(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, user, router]);

  const handleCancel = async () => {
    if (!booking) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      const res = await api.bookings.cancel(booking.id);
      setBooking(res);
      setShowCancelDialog(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Erro ao cancelar');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-xl text-gray-500">Reserva não encontrada</p>
        <Button className="mt-4" onClick={() => router.push('/bookings')}>
          Ver reservas
        </Button>
      </div>
    );
  }

  const status = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.pending;
  const StatusIcon = statusIconMap[booking.status] || Clock;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/bookings')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Detalhes da Reserva</CardTitle>
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property */}
          <Link href={`/properties/${booking.propertyId}`} className="block">
            <div className="flex gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={booking.propertyPhoto}
                  alt={booking.propertyTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold line-clamp-1">
                  {booking.propertyTitle}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Ver propriedade →</p>
              </div>
            </div>
          </Link>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                {new Date(booking.checkIn).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                {new Date(booking.checkOut).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            {booking.guests} hóspede(s) · {booking.totalNights} noites
          </div>

          <Separator />

          {/* Price breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Detalhes do pagamento</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  R$ {booking.pricePerNight} x {booking.totalNights} noites
                </span>
                <span>
                  R$ {(booking.pricePerNight * booking.totalNights).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taxa de limpeza</span>
                <span>R$ {booking.cleaningFee.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taxa de serviço</span>
                <span>R$ {booking.serviceFee.toLocaleString('pt-BR')}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>R$ {booking.totalPrice.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <>
              <Separator />
              {cancelError && <p className="text-sm text-red-500 text-center">{cancelError}</p>}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelando...' : 'Cancelar Reserva'}
              </Button>
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {cancelLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <p className="text-xs text-gray-400 text-center">
            Reserva criada em{' '}
            {new Date(booking.createdAt).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
