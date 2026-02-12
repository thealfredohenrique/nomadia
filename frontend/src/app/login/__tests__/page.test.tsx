import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';

const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockLogin.mockReset();
  mockPush.mockReset();
});

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Entrar no Nomadia')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('should have pre-filled credentials', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toHaveValue('maria@example.com');
    expect(screen.getByLabelText('Senha')).toHaveValue('mock.maria');
  });

  it('should show test accounts info', () => {
    render(<LoginPage />);
    expect(screen.getByText('Contas de teste:')).toBeInTheDocument();
  });

  it('should call login and redirect on success', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('maria@example.com', 'mock.maria');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should show error on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'));
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('should show link to register page', () => {
    render(<LoginPage />);
    const link = screen.getByText('Cadastre-se');
    expect(link).toHaveAttribute('href', '/register');
  });
});
