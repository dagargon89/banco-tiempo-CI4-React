import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog open={false} title="X" message="m" confirmLabel="OK" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.queryByText('m')).not.toBeInTheDocument();
  });

  it('blocks confirm until cascade checkbox is checked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Test"
        message="Mensaje"
        cascadeCheckLabel="Confirmo que pausará 3 ofertas"
        confirmLabel="Borrar"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    const confirm = screen.getByRole('button', { name: 'Borrar' });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Confirmo que pausará 3 ofertas'));
    expect(confirm).not.toBeDisabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('passes motivo when provided', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Baja"
        message="?"
        motivoLabel="Motivo"
        confirmLabel="Confirmar"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'spam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledWith({ motivo: 'spam' });
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="X" message="m" confirmLabel="OK" onConfirm={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
