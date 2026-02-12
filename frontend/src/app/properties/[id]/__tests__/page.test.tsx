import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock api
const mockGetProperty = jest.fn().mockResolvedValue({
  id: 'p1',
  hostId: 'h1',
  title: 'Apartamento Vista Mar',
  description: 'Lindo apartamento com vista para o mar',
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
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhood: 'Copacabana',
    street: 'Rua Test',
    number: '100',
    country: 'Brasil',
    zipCode: '22000-000',
    latitude: -22.97,
    longitude: -43.17,
  },
  photos: [
    { id: '1', url: 'https://example.com/photo1.jpg', order: 0 },
    { id: '2', url: 'https://example.com/photo2.jpg', order: 1 },
  ],
  amenities: ['Wi-Fi', 'Ar-condicionado', 'Piscina'],
  reviews: [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'Maria',
      rating: 5,
      comment: 'Excelente lugar!',
      createdAt: '2026-01-15T00:00:00Z',
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
});

jest.mock('@/lib/api', () => ({
  api: {
    properties: {
      get: (...args: any[]) => mockGetProperty(...args),
    },
    bookings: {
      create: jest.fn().mockResolvedValue({ id: 'b1', status: 'confirmed' }),
    },
  },
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', firstName: 'Test', role: 'guest' },
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: 'p1' }),
}));

import PropertyDetailPage from '../page';

describe('PropertyDetailPage', () => {
  const renderPage = async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <PropertyDetailPage params={Promise.resolve({ id: 'p1' })} />
        </Suspense>
      );
    });
  };

  it('should render property title after loading', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Apartamento Vista Mar')).toBeInTheDocument();
    });
  });

  it('should render amenities', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
      expect(screen.getByText('Piscina')).toBeInTheDocument();
    });
  });

  it('should render reviews', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Excelente lugar!')).toBeInTheDocument();
    });
  });

  it('should render price', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/R\$ 350/)).toBeInTheDocument();
    });
  });
});
