import { CheckCircle } from 'lucide-react';

interface PropertyAmenitiesProps {
  amenities: string[];
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Comodidades</h2>
      <div className="grid grid-cols-2 gap-3">
        {amenities.map((amenity) => (
          <div key={amenity} className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {amenity}
          </div>
        ))}
      </div>
    </div>
  );
}
