'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PropertyPhotoGallery } from '@/components/properties/property-photo-gallery';
import { PropertyAmenities } from '@/components/properties/property-amenities';
import { PropertyReviews } from '@/components/properties/property-reviews';
import { PropertyInfo } from '@/components/properties/property-info';
import { BookingWidget } from '@/components/booking/booking-widget';
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
} from 'lucide-react';

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.properties
      .get(id)
      .then((res) => setProperty(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
      <PropertyPhotoGallery photos={property.photos} title={property.title} />

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

          <PropertyAmenities amenities={property.amenities} />

          <Separator />

          <PropertyInfo
            checkInTime={property.checkInTime}
            checkOutTime={property.checkOutTime}
            cancellationPolicy={property.cancellationPolicy}
            minimumNights={property.minimumNights}
          />

          <Separator />

          {property.reviews && (
            <PropertyReviews
              reviews={property.reviews}
              totalReviews={property.totalReviews}
            />
          )}
        </div>

        {/* Right column - Booking card */}
        <div>
          <BookingWidget property={property} />
        </div>
      </div>
    </div>
  );
}
