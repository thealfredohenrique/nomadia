import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock api
jest.mock('@/lib/api', () => ({
  api: {
    bookings: {
      list: jest.fn().mockResolvedValue({
        data: [
          {
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
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
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
  useRouter: () => ({ push: jest.fn() }),
}));

import BookingsPage from '../page';

describe('BookingsPage', () => {
  it('should render page title', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Minhas Reservas')).toBeInTheDocument();
    });
  });

  it('should render booking card', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Apartamento Teste')).toBeInTheDocument();
    });
  });

  it('should render booking status', async () => {
    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });
  });
});
