import { periodoPrescrito } from './tratamientos';

describe('Período de tratamiento prescrito', () => {
  const inicio = new Date('2026-09-01T10:00:00Z');
  it('incluye el último día de un tratamiento temporal', () => {
    expect(periodoPrescrito(inicio, '7 días', '2026-09-07')).toEqual({ inicio: '2026-09-01', fin: '2026-09-07' });
  });
  it('excluye recetas antiguas y futuras', () => {
    expect(periodoPrescrito(inicio, '7', '2026-09-08')).toBeNull();
    expect(periodoPrescrito(inicio, '7', '2026-08-31')).toBeNull();
  });
  it.each(['', '0', '-1', '1.5', 'según necesidad', 'continuo', '999999999999999999'])('no inventa fechas para %s', duracion => {
    expect(periodoPrescrito(inicio, duracion, '2026-09-01')).toBeNull();
  });
  it('maneja tratamientos que cruzan el cambio de mes', () => {
    expect(periodoPrescrito(new Date('2026-08-31'), '2', '2026-09-01')?.fin).toBe('2026-09-01');
  });
});
