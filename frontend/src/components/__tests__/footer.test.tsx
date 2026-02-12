import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '../layout/footer';

describe('Footer', () => {
  it('should render Nomadia branding', () => {
    render(<Footer />);
    expect(screen.getByText('Nomadia')).toBeInTheDocument();
  });

  it('should render Descubra section', () => {
    render(<Footer />);
    expect(screen.getByText('Descubra')).toBeInTheDocument();
    expect(screen.getByText('Apartamentos')).toBeInTheDocument();
    expect(screen.getByText('Casas')).toBeInTheDocument();
  });

  it('should render Destinos Populares section', () => {
    render(<Footer />);
    expect(screen.getByText('Destinos Populares')).toBeInTheDocument();
    expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(screen.getByText('Gramado')).toBeInTheDocument();
  });

  it('should render copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Nomadia/)).toBeInTheDocument();
  });
});
