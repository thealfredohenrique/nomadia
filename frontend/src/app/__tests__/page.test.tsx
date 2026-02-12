import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock api
jest.mock('@/lib/api', () => ({
  api: {
    properties: {
      list: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'p1',
            title: 'Destaque Property',
            propertyType: 'apartment',
            maxGuests: 4,
            bedrooms: 2,
            pricePerNight: 250,
            averageRating: 4.5,
            totalReviews: 10,
            instantBooking: false,
            address: { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Copacabana' },
            photos: [{ id: '1', url: 'https://example.com/photo.jpg', order: 0 }],
            amenities: ['Wi-Fi'],
            status: 'active',
          },
        ],
        pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
      }),
    },
  },
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import HomePage from '../page';

describe('HomePage', () => {
  it('should render hero section', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText(/Encontre/i)).toBeInTheDocument();
    });
  });

  it('should render property type categories', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('Apartamentos')).toBeInTheDocument();
      expect(screen.getByText('Casas')).toBeInTheDocument();
    });
  });

  it('should render featured properties', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('Destaque Property')).toBeInTheDocument();
    });
  });
});
