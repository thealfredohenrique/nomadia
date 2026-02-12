'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Property } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Suspense } from 'react';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    guests: searchParams.get('guests') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    sortBy: searchParams.get('sortBy') || '',
  });

  const debouncedCity = useDebounce(filters.city, 300);

  const debouncedFilters = { ...filters, city: debouncedCity };

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(debouncedFilters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });

    api.properties
      .list(params)
      .then((res) => {
        setProperties(res.data);
        setTotal(res.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCity, filters.propertyType, filters.minPrice, filters.maxPrice, filters.guests, filters.bedrooms, filters.sortBy]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      guests: '',
      bedrooms: '',
      sortBy: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 border rounded-lg px-4 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cidade..."
            value={filters.city}
            onChange={(e) => updateFilter('city', e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 p-0"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="border rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={filters.propertyType}
              onValueChange={(v) => updateFilter('propertyType', v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="room">Quarto</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Preço mín. (R$)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Preço máx. (R$)</Label>
            <Input
              type="number"
              placeholder="10000"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Hóspedes</Label>
            <Input
              type="number"
              placeholder="1"
              min="1"
              value={filters.guests}
              onChange={(e) => updateFilter('guests', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Ordenar por</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => updateFilter('sortBy', v === 'default' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Relevância" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Relevância</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                <SelectItem value="rating">Melhor avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {total} acomodaç{total === 1 ? 'ão' : 'ões'} encontrada{total === 1 ? '' : 's'}
        {filters.city && ` em "${filters.city}"`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">
            Nenhuma acomodação encontrada
          </p>
          <p className="text-gray-400 mt-2">
            Tente ajustar seus filtros
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={clearFilters}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Carregando...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
