import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../layout/header';

// Mock useAuth
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  mockLogout.mockReset();
  mockUseAuth.mockReset();
});

describe('Header', () => {
  it('should render logo', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: mockLogout });
    render(<Header />);
    expect(screen.getByText('Nomadia')).toBeInTheDocument();
  });

  it('should render Explorar link', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: mockLogout });
    render(<Header />);
    expect(screen.getByText('Explorar')).toBeInTheDocument();
  });

  it('should show Login and Register buttons when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: mockLogout });
    render(<Header />);
    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar')).toBeInTheDocument();
  });

  it('should show user name when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Maria', email: 'maria@example.com', role: 'guest' },
      loading: false,
      logout: mockLogout,
    });
    render(<Header />);
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });
});
