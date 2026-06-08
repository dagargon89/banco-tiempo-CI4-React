import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerificacionBadge from '../VerificacionBadge';

describe('VerificacionBadge', () => {
  it('muestra "Verificado" para estado verificado', () => {
    render(<VerificacionBadge estado="verificado" />);
    expect(screen.getByText('Verificado')).toBeInTheDocument();
  });

  it('muestra "Pendiente" para estado pendiente', () => {
    render(<VerificacionBadge estado="pendiente" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra "Rechazado" para estado rechazado', () => {
    render(<VerificacionBadge estado="rechazado" />);
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
  });

  it('muestra "No verificado" para estado no_verificado', () => {
    render(<VerificacionBadge estado="no_verificado" />);
    expect(screen.getByText('No verificado')).toBeInTheDocument();
  });
});
