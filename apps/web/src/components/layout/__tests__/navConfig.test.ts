import { describe, it, expect } from 'vitest';
import { estaActivo, gruposDeNavegacion, inicioAdmin, principal, tituloDeRuta } from '../navConfig';
import { etiquetaEstado, papelEn } from '@/lib/intercambio';
import type { VinculacionCard } from '@/lib/types';

const item = (to: string) => principal.find((i) => i.to === to)!;

describe('navegación del panel', () => {
  it('muestra el mismo menú en cualquier sección del panel, sin modos', () => {
    const enExplorar = gruposDeNavegacion('/inicio', [], true);
    const enEnsenando = gruposDeNavegacion('/ensenando', [], true);
    const enMensajes = gruposDeNavegacion('/mensajes', [], true);
    expect(enEnsenando).toEqual(enExplorar);
    expect(enMensajes).toEqual(enExplorar);
  });

  it('solo cambia el menú en administración o sin verificar', () => {
    expect(gruposDeNavegacion('/admin/usuarios', ['moderador'], true)[0].label).toBe('Administración');
    expect(gruposDeNavegacion('/perfil', [], false)[0].items.map((i) => i.to)).toEqual(['/perfil', '/verificacion']);
  });

  it('marca la sección correcta en rutas internas', () => {
    expect(estaActivo(item('/ensenando'), '/ofertas/nueva')).toBe(true);
    expect(estaActivo(item('/ensenando'), '/ofertas/12/editar')).toBe(true);
    expect(estaActivo(item('/inicio'), '/ofertas/12')).toBe(true);
    expect(estaActivo(item('/inicio'), '/ofertas/12/editar')).toBe(false);
  });

  it('lleva a la primera sección de administración permitida', () => {
    expect(inicioAdmin(['soporte'])).toBe('/admin/tickets');
    expect(inicioAdmin(['super_admin'])).toBe('/admin/verificaciones');
  });

  it('da un título legible a cada ruta', () => {
    expect(tituloDeRuta('/aprendiendo')).toBe('Aprendiendo');
    expect(tituloDeRuta('/vinculaciones/4')).toBe('Intercambio');
    expect(tituloDeRuta('/admin/metricas')).toBe('Métricas');
  });
});

describe('intercambios según el papel', () => {
  const v = { oferente_id: 7, buscador_id: 9 } as VinculacionCard;

  it('sabe si la persona enseña o aprende', () => {
    expect(papelEn(v, 7)).toBe('ensenando');
    expect(papelEn(v, 9)).toBe('aprendiendo');
  });

  it('nombra el mismo estado desde cada lado', () => {
    expect(etiquetaEstado('solicitada', 'ensenando')).toBe('Por responder');
    expect(etiquetaEstado('solicitada', 'aprendiendo')).toBe('Esperando respuesta');
  });
});
