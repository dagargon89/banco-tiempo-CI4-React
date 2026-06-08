import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '../ProtectedRoute';

function renderWithRouter(initialRoute: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      loading: false,
      initialized: true,
      error: null,
    });
  });

  it('redirige a /login si no hay usuario', () => {
    renderWithRouter('/');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('muestra el contenido si hay usuario', () => {
    useAuthStore.setState({
      user: {
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        email_verificado: false,
        estado_verificacion: 'no_verificado',
        roles: [],
      },
      loading: false,
      initialized: true,
    });
    renderWithRouter('/');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('muestra spinner mientras carga', () => {
    useAuthStore.setState({ loading: true, initialized: false });
    const { container } = renderWithRouter('/');
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
