import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/lib/types';
import { PROPERTY_TYPE_LABELS } from '@/lib/property-utils';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <div className="rounded-xl overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={property.photos[0]?.url || '/placeholder.jpg'}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {property.instantBooking && (
            <Badge className="absolute top-2 left-2 bg-rose-500 text-white text-xs">
              Reserva Instantânea
            </Badge>
          )}
        </div>
        <div className="pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {property.address.city}, {property.address.state}
              </span>
            </div>
            {property.averageRating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{property.averageRating}</span>
                <span className="text-gray-400">({property.totalReviews})</span>
              </div>
            )}
          </div>
          <h3 className="font-semibold mt-1 text-gray-900 line-clamp-1 group-hover:text-rose-500 transition-colors">
            {property.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType} ·{' '}
            {property.maxGuests} hóspedes · {property.bedrooms} quartos
          </p>
          <p className="mt-2">
            <span className="font-bold text-lg">
              R$ {property.pricePerNight}
            </span>
            <span className="text-gray-500 text-sm"> /noite</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
