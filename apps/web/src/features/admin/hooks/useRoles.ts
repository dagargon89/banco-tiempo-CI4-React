import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Rol = 'moderador' | 'super_admin' | 'soporte' | 'verificador' | 'analista' | 'editor_categorias';

export function useAsignarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rol }: { id: number; rol: Rol }) => {
      const { data } = await api.post<{ data: { message: string; rol: Rol } }>(
        `/admin/usuarios/${id}/roles`,
        { rol },
      );
      return data.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-usuario', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin-moderadores'] });
    },
  });
}

export function useRevocarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rol }: { id: number; rol: Rol }) => {
      const { data } = await api.delete<{ data: { message: string; rol: Rol } }>(
        `/admin/usuarios/${id}/roles/${rol}`,
      );
      return data.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-usuario', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin-moderadores'] });
    },
  });
}
