import { describe, it, expect } from 'vitest';
import { describirDuracion, formatoCompacto, formatoMinutos } from '../duracion';

describe('formatoMinutos', () => {
  it('formatea minutos, horas y mixtos', () => {
    expect(formatoMinutos(45)).toBe('45 min');
    expect(formatoMinutos(60)).toBe('1 h');
    expect(formatoMinutos(90)).toBe('1 h 30 min');
  });
});

describe('formatoCompacto', () => {
  it('usa fracciones de hora para el talón', () => {
    expect(formatoCompacto(135)).toBe('2¼ h');
    expect(formatoCompacto(90)).toBe('1½ h');
    expect(formatoCompacto(105)).toBe('1¾ h');
    expect(formatoCompacto(240)).toBe('4 h');
    expect(formatoCompacto(30)).toBe('30 min');
  });
});

describe('describirDuracion', () => {
  it('multiplica sesiones por duración', () => {
    expect(describirDuracion(60, 4)).toEqual({ total: '4 h', detalle: '4 sesiones de 1 h' });
    expect(describirDuracion('180', '1')).toEqual({ total: '3 h', detalle: 'Una sesión de 3 h' });
  });

  it('acepta datos parciales', () => {
    expect(describirDuracion(45, null)).toEqual({ total: '45 min', detalle: 'Por sesión' });
    expect(describirDuracion(null, 3)).toEqual({ total: '3 sesiones', detalle: 'Duración por acordar' });
  });

  it('devuelve null sin datos o con valores inválidos', () => {
    expect(describirDuracion(null, undefined)).toEqual({ total: null, detalle: null });
    expect(describirDuracion('', 0)).toEqual({ total: null, detalle: null });
  });
});
