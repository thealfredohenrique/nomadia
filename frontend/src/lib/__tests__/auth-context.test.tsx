import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';

// Mock api module
jest.mock('../api', () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      me: jest.fn(),
    },
  },
}));

import { api } from '../api';

function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <button data-testid="login" onClick={() => login('test@example.com', 'pass')}>Login</button>
      <button data-testid="register" onClick={() => register({
        email: 'new@example.com',
        password: 'pass',
        firstName: 'New',
        lastName: 'User',
      })}>Register</button>
      <button data-testid="logout" onClick={logout}>Logout</button>
    </div>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('AuthProvider', () => {
  it('should start with no user when no token stored', async () => {
    (api.auth.me as jest.Mock).mockRejectedValue(new Error('No token'));

    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });

    expect(getByTestId('user').textContent).toBe('null');
  });

  it('should restore user from token on mount', async () => {
    localStorage.setItem('accessToken', 'stored-token');
    (api.auth.me as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'stored@example.com',
      firstName: 'Stored',
    });

    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('stored@example.com');
    });
  });

  it('should login and set user', async () => {
    (api.auth.me as jest.Mock).mockRejectedValue(new Error());
    (api.auth.login as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'new-token',
      refreshToken: 'refresh-token',
    });

    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      getByTestId('login').click();
    });

    expect(getByTestId('user').textContent).toBe('test@example.com');
    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
  });

  it('should register and set user', async () => {
    (api.auth.me as jest.Mock).mockRejectedValue(new Error());
    (api.auth.register as jest.Mock).mockResolvedValue({
      user: { id: '2', email: 'new@example.com' },
      accessToken: 'reg-token',
      refreshToken: 'reg-refresh',
    });

    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      getByTestId('register').click();
    });

    expect(getByTestId('user').textContent).toBe('new@example.com');
    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'reg-token');
  });

  it('should logout and clear user', async () => {
    localStorage.setItem('accessToken', 'token');
    (api.auth.me as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    });

    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('test@example.com');
    });

    act(() => {
      getByTestId('logout').click();
    });

    expect(getByTestId('user').textContent).toBe('null');
    expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});

describe('useAuth', () => {
  it('should throw when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within AuthProvider');

    spy.mockRestore();
  });
});
