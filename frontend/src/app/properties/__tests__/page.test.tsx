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
            title: 'Test Property',
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
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    },
  },
}));

// Mock useAuth
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Must mock useSearchParams for this page since it uses Suspense
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Import after mocks
import PropertiesPage from '../page';

describe('PropertiesPage', () => {
  it('should render the page title', async () => {
    render(<PropertiesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Acomodações/i)).toBeInTheDocument();
    });
  });
});
