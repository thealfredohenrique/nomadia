'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Property } from '@/lib/types';
import { calculateBookingPrice } from '@/lib/booking-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';

interface BookingWidgetProps {
  property: Property;
}

export function BookingWidget({ property }: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const price = calculateBookingPrice(
    property.pricePerNight,
    property.cleaningFee,
    checkIn,
    checkOut,
  );

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      setBookingError('Selecione as datas');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await api.bookings.create({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests,
      });
      setBookingSuccess(true);
      setTimeout(() => router.push(`/bookings/${res.id}`), 1500);
    } catch (err: unknown) {
      setBookingError(
        err instanceof Error ? err.message : 'Erro ao criar reserva',
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-2xl font-bold">
              R$ {property.pricePerNight}
            </span>
            <span className="text-gray-500"> /noite</span>
          </div>
          {property.instantBooking && (
            <Badge className="bg-rose-100 text-rose-700">Instantânea</Badge>
          )}
        </div>

        {bookingSuccess ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-lg">Reserva criada!</p>
            <p className="text-sm text-gray-500">Redirecionando...</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden mb-4">
              <div className="grid grid-cols-2">
                <div className="p-3 border-r">
                  <Label className="text-xs font-semibold">CHECK-IN</Label>
                  <Input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
                  />
                </div>
                <div className="p-3">
                  <Label className="text-xs font-semibold">CHECK-OUT</Label>
                  <Input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
                  />
                </div>
              </div>
              <div className="border-t p-3">
                <Label className="text-xs font-semibold">HÓSPEDES</Label>
                <Input
                  type="number"
                  min={1}
                  max={property.maxGuests}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
            </div>

            {bookingError && (
              <p className="text-sm text-red-500 mb-3">{bookingError}</p>
            )}

            <Button
              className="w-full bg-rose-500 hover:bg-rose-600 mb-4"
              size="lg"
              onClick={handleBooking}
              disabled={bookingLoading}
            >
              {bookingLoading
                ? 'Reservando...'
                : user
                  ? 'Reservar'
                  : 'Entrar para reservar'}
            </Button>

            {price && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    R$ {property.pricePerNight} x {price.nights} noites
                  </span>
                  <span>R$ {price.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxa de limpeza</span>
                  <span>R$ {price.cleaningFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxa de serviço</span>
                  <span>R$ {price.serviceFee}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>R$ {price.total}</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
