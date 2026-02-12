import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../properties/property-card';
import { Property } from '@/lib/types';

const mockProperty: Property = {
  id: 'p1',
  hostId: 'h1',
  title: 'Apartamento Vista Mar',
  description: 'Lindo apartamento',
  propertyType: 'apartment',
  roomType: 'entire_place',
  maxGuests: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 1,
  pricePerNight: 350,
  cleaningFee: 100,
  currency: 'BRL',
  minimumNights: 2,
  maximumNights: 30,
  checkInTime: '14:00',
  checkOutTime: '11:00',
  cancellationPolicy: 'flexible',
  instantBooking: true,
  status: 'active',
  averageRating: 4.8,
  totalReviews: 25,
  viewsCount: 100,
  address: {
    street: 'Rua Test',
    number: '100',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brasil',
    zipCode: '22000-000',
    latitude: -22.97,
    longitude: -43.17,
  },
  photos: [{ id: '1', url: 'https://example.com/photo.jpg', order: 0 }],
  amenities: ['Wi-Fi', 'Pool'],
  createdAt: '2026-01-01T00:00:00Z',
};

describe('PropertyCard', () => {
  it('should render property title', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Apartamento Vista Mar')).toBeInTheDocument();
  });

  it('should render location', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Rio de Janeiro, RJ')).toBeInTheDocument();
  });

  it('should render price', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('R$ 350')).toBeInTheDocument();
    expect(screen.getByText('/noite')).toBeInTheDocument();
  });

  it('should render rating when available', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(25)')).toBeInTheDocument();
  });

  it('should render property type and guest info', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getAllByText(/Apartamento/).length).toBeGreaterThan(0);
    expect(screen.getByText(/4 hóspedes/)).toBeInTheDocument();
    expect(screen.getByText(/2 quartos/)).toBeInTheDocument();
  });

  it('should show instant booking badge', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Reserva Instantânea')).toBeInTheDocument();
  });

  it('should not show instant booking badge when false', () => {
    render(<PropertyCard property={{ ...mockProperty, instantBooking: false }} />);
    expect(screen.queryByText('Reserva Instantânea')).not.toBeInTheDocument();
  });

  it('should link to property detail page', () => {
    render(<PropertyCard property={mockProperty} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/p1');
  });

  it('should not render rating when null', () => {
    render(<PropertyCard property={{ ...mockProperty, averageRating: null }} />);
    expect(screen.queryByText('4.8')).not.toBeInTheDocument();
  });
});
