'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Property, PaginatedResponse } from '@/lib/types';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building2, Home as HomeIcon, Bed } from 'lucide-react';

export default function HomePage() {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.properties
      .list({ sortBy: 'rating', limit: '8' })
      .then((res) => {
        const data = res as PaginatedResponse<Property>;
        setFeatured(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.set('city', searchCity);
    router.push(`/properties?${params.toString()}`);
  };

  const categories = [
    { icon: Building2, label: 'Apartamentos', type: 'apartment' },
    { icon: HomeIcon, label: 'Casas', type: 'house' },
    { icon: Bed, label: 'Quartos', type: 'room' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-500 to-rose-700 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Encontre sua próxima estadia
          </h1>
          <p className="text-lg md:text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
            Acomodações únicas em todo o Brasil. De apartamentos em Copacabana a
            chalés em Gramado.
          </p>

          <form
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto bg-white rounded-full flex items-center p-2 shadow-lg"
          >
            <div className="flex-1 flex items-center gap-2 px-4">
              <MapPin className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Para onde você vai? (ex: Rio de Janeiro, Gramado...)"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Button
              type="submit"
              className="rounded-full bg-rose-500 hover:bg-rose-600 px-6"
            >
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Explore por tipo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.type}
              onClick={() => router.push(`/properties?propertyType=${cat.type}`)}
              className="flex items-center gap-4 p-6 rounded-xl border hover:border-rose-300 hover:bg-rose-50 transition-colors text-left"
            >
              <cat.icon className="h-10 w-10 text-rose-500" />
              <div>
                <p className="font-semibold text-lg">{cat.label}</p>
                <p className="text-sm text-gray-500">Ver disponíveis</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Destaques</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-[4/3]" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/properties')}
            className="border-rose-300 text-rose-500 hover:bg-rose-50"
          >
            Ver todas as acomodações
          </Button>
        </div>
      </section>
    </div>
  );
}
