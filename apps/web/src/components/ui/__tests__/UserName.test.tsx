import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserName from '../UserName';

describe('UserName', () => {
  it('shows only name when not inactivo', () => {
    render(<UserName nombre="María" />);
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
  });

  it('shows chip when inactivo', () => {
    render(<UserName nombre="María" inactivo />);
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('shows chip when inactivo is truthy (1)', () => {
    render(<UserName nombre="María" inactivo={1 as unknown as boolean} />);
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });
});
