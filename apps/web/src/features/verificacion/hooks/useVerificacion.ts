import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSubirDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      archivo: Blob;
      tipo_documento: string;
      content_type: string;
      size: number;
    }) => {
      const formData = new FormData();
      formData.append('archivo', params.archivo, 'documento.enc');
      formData.append('tipo_documento', params.tipo_documento);
      formData.append('content_type', params.content_type);
      formData.append('size', String(params.size));

      const { data } = await api.post('/verificacion/documentos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['verificacion-estado'] });
    },
  });
}
