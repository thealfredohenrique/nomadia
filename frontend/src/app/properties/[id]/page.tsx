'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Property, Booking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  Wifi,
  CheckCircle,
  Shield,
  Clock,
} from 'lucide-react';

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    api.properties
      .get(id)
      .then((res) => setProperty(res as Property))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const calculatePrice = () => {
    if (!property || !checkIn || !checkOut) return null;
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (nights <= 0) return null;
    const subtotal = property.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.1);
    return {
      nights,
      subtotal,
      cleaningFee: property.cleaningFee,
      serviceFee,
      total: subtotal + property.cleaningFee + serviceFee,
    };
  };

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
      const res = (await api.bookings.create({
        propertyId: id,
        checkIn,
        checkOut,
        guests,
      })) as Booking;
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

  const price = calculatePrice();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-96 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-xl text-gray-500">Propriedade não encontrada</p>
        <Button className="mt-4" onClick={() => router.push('/properties')}>
          Ver acomodações
        </Button>
      </div>
    );
  }

  const policyLabels: Record<string, string> = {
    flexible: 'Flexível',
    moderate: 'Moderada',
    strict: 'Rigorosa',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
        {property.averageRating && (
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <strong className="text-gray-900">{property.averageRating}</strong>
            <span>({property.totalReviews} avaliações)</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {property.address.neighborhood}, {property.address.city} -{' '}
          {property.address.state}
        </span>
      </div>

      {/* Photos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden">
        <div className="relative aspect-[4/3]">
          <Image
            src={property.photos[selectedPhoto]?.url || ''}
            alt={property.photos[selectedPhoto]?.caption || property.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {property.photos.slice(0, 4).map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(i)}
              className={`relative aspect-[4/3] overflow-hidden ${
                selectedPhoto === i ? 'ring-2 ring-rose-500' : ''
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.caption || ''}
                fill
                className="object-cover hover:opacity-90 transition-opacity"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick info */}
          <div className="flex items-center gap-6 text-gray-600">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {property.maxGuests} hóspedes
            </span>
            <span className="flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              {property.bedrooms} quartos
            </span>
            <span className="flex items-center gap-2">
              <Bath className="h-5 w-5" />
              {property.bathrooms} banheiros
            </span>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Sobre este espaço</h2>
            <p className="text-gray-600 leading-relaxed">
              {property.description}
            </p>
          </div>

          <Separator />

          {/* Amenities */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Comodidades</h2>
            <div className="grid grid-cols-2 gap-3">
              {property.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* House rules */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Informações</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                Check-in: {property.checkInTime}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                Check-out: {property.checkOutTime}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                Cancelamento: {policyLabels[property.cancellationPolicy]}
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-gray-400" />
                Mínimo {property.minimumNights} noites
              </div>
            </div>
          </div>

          <Separator />

          {/* Reviews */}
          {property.reviews && property.reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Avaliações ({property.totalReviews})
              </h2>
              <div className="space-y-4">
                {property.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.userPhoto} />
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{review.userName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Booking card */}
        <div>
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
        </div>
      </div>
    </div>
  );
}
