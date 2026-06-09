import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockGet = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { useExplorarOfertas } from '../hooks/useOfertas';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useExplorarOfertas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pasa filtros como query params', async () => {
    const mockData = {
      data: [{ id: 1, titulo: 'Guitarra' }],
      meta: { total: 1, page: 1, per_page: 12 },
    };
    mockGet.mockResolvedValue({ data: mockData });

    const { result } = renderHook(
      () => useExplorarOfertas({ categoria_id: 3, modalidad: 'virtual', page: 2 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledTimes(1);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('categoria_id=3');
    expect(url).toContain('modalidad=virtual');
    expect(url).toContain('page=2');
  });

  it('no incluye filtros null o undefined', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { total: 0, page: 1, per_page: 12 } },
    });

    const { result } = renderHook(
      () => useExplorarOfertas({ categoria_id: null, modalidad: null }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = mockGet.mock.calls[0][0] as string;
    expect(url).not.toContain('categoria_id');
    expect(url).not.toContain('modalidad');
  });
});
