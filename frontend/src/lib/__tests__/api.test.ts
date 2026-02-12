import { api } from '../api';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe('api', () => {
  describe('request helper', () => {
    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      });

      await api.properties.list();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.auth.me();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(api.auth.me()).rejects.toThrow('Unauthorized');
    });

    it('should handle 204 No Content', async () => {
      localStorage.setItem('accessToken', 'token');
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await api.bookings.cancel('123');
      expect(result).toEqual({});
    });
  });

  describe('auth endpoints', () => {
    it('should call register endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ user: {}, accessToken: 'jwt' }),
      });

      await api.auth.register({
        email: 'test@example.com',
        password: 'pass',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/auth/register',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should call login endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: {}, accessToken: 'jwt' }),
      });

      await api.auth.login('test@example.com', 'pass');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
        }),
      );
    });

    it('should call me endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', email: 'test@example.com' }),
      });

      await api.auth.me();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/auth/me',
        expect.anything(),
      );
    });
  });

  describe('properties endpoints', () => {
    it('should call list with query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [], pagination: {} }),
      });

      await api.properties.list({ city: 'Rio', sortBy: 'price_asc' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/properties?city=Rio&sortBy=price_asc'),
        expect.anything(),
      );
    });

    it('should call get by id', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'p1' }),
      });

      await api.properties.get('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/properties/p1',
        expect.anything(),
      );
    });
  });

  describe('bookings endpoints', () => {
    it('should call create', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'b1' }),
      });

      await api.bookings.create({
        propertyId: 'p1',
        checkIn: '2026-03-01',
        checkOut: '2026-03-05',
        guests: 2,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/bookings',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should call list with params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      });

      await api.bookings.list({ status: 'confirmed' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/bookings?status=confirmed'),
        expect.anything(),
      );
    });

    it('should call cancel', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'cancelled' }),
      });

      await api.bookings.cancel('b1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/bookings/b1/cancel',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('users endpoints', () => {
    it('should call getPublic', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'u1', firstName: 'Test' }),
      });

      await api.users.getPublic('u1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/v1/users/u1',
        expect.anything(),
      );
    });
  });
});
