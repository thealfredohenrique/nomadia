import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../page';

const mockRegister = jest.fn();
const mockPush = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockRegister.mockReset();
  mockPush.mockReset();
});

describe('RegisterPage', () => {
  it('should render registration form', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobrenome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('should render role selection buttons', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Hóspede')).toBeInTheDocument();
    expect(screen.getByText('Anfitrião')).toBeInTheDocument();
  });

  it('should submit form with data', async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Sobrenome'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Pass123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Pass123!',
        role: 'guest',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should show error on register failure', async () => {
    mockRegister.mockRejectedValue(new Error('Email já cadastrado'));
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Sobrenome'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Pass123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(screen.getByText('Email já cadastrado')).toBeInTheDocument();
    });
  });

  it('should show link to login page', () => {
    render(<RegisterPage />);
    const link = screen.getByText('Entrar');
    expect(link).toHaveAttribute('href', '/login');
  });
});
