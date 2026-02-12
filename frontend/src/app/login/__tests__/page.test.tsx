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

  it('should have empty credentials by default', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Senha')).toHaveValue('');
  });

  it('should show test accounts info', () => {
    render(<LoginPage />);
    expect(screen.getByText('Contas de teste:')).toBeInTheDocument();
  });

  it('should call login and redirect on success', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'mock.maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('maria@example.com', 'mock.maria');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should show error on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrongpass' } });
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
