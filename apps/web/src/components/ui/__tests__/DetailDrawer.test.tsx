import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetailDrawer from '../DetailDrawer';

describe('DetailDrawer', () => {
  it('renders children when open', () => {
    render(<DetailDrawer open onClose={() => {}} title="Test">Contenido</DetailDrawer>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<DetailDrawer open={false} onClose={() => {}} title="X">Hidden</DetailDrawer>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<DetailDrawer open onClose={onClose} title="X">y</DetailDrawer>);
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on ESC key', () => {
    const onClose = vi.fn();
    render(<DetailDrawer open onClose={onClose} title="X">y</DetailDrawer>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders footer slot when provided', () => {
    render(
      <DetailDrawer open onClose={() => {}} title="X" footer={<button>Acción</button>}>
        body
      </DetailDrawer>
    );
    expect(screen.getByRole('button', { name: 'Acción' })).toBeInTheDocument();
  });
});
