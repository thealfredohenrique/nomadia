import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

const mockBooking = {
  id: 'b1',
  propertyId: 'p1',
  guestId: 'g1',
  hostId: 'h1',
  checkIn: '2026-03-01',
  checkOut: '2026-03-05',
  guests: 2,
  totalNights: 4,
  pricePerNight: 200,
  cleaningFee: 50,
  serviceFee: 80,
  totalPrice: 930,
  currency: 'BRL',
  status: 'confirmed',
  propertyTitle: 'Apartamento Teste',
  propertyPhoto: 'https://example.com/photo.jpg',
  createdAt: '2026-02-01T00:00:00Z',
};

jest.mock('@/lib/api', () => ({
  api: {
    bookings: {
      get: jest.fn().mockResolvedValue(mockBooking),
      cancel: jest.fn().mockResolvedValue({ ...mockBooking, status: 'cancelled' }),
    },
  },
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'g1', firstName: 'Maria', role: 'guest' },
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useParams: () => ({ id: 'b1' }),
}));

import BookingDetailPage from '../page';

describe('BookingDetailPage', () => {
  const renderPage = async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <BookingDetailPage params={Promise.resolve({ id: 'b1' })} />
        </Suspense>
      );
    });
  };

  it('should render booking property title', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Apartamento Teste')).toBeInTheDocument();
    });
  });

  it('should render booking status', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });
  });

  it('should render total price', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/930/)).toBeInTheDocument();
    });
  });
});
