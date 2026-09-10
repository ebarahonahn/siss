import { HospitalizacionService } from './hospitalizacion.service';

describe('Indicadores hospitalarios', () => {
  const servicio = { id: 9, catServicio: { nombre: 'Servicio destino' } };
  const cama = (estado: string) => ({ estado, habitacion: { sala: { servicio } } });
  const egreso = (inicio: string, fin: string) => ({
    fechaEgreso: new Date(fin), ingreso: { servicioId: 1, fechaIngreso: new Date(inicio),
      cama: { habitacion: { sala: { servicioId: 9 } } } },
  });
  function setup(camas: any[], egresos: any[] = []) {
    const prisma = {
      cama: { findMany: jest.fn().mockResolvedValue(camas) },
      egresoHospitalario: { findMany: jest.fn().mockResolvedValue(egresos) },
      $transaction: (queries: Promise<any>[]) => Promise.all(queries),
    };
    return { prisma, service: new HospitalizacionService(prisma as any) };
  }
  it('limita las consultas al establecimiento y servicio, y usa la cama de destino', async () => {
    const { service, prisma } = setup([cama('OCUPADA')]);
    const result = await service.obtenerEstadisticas(3, 9);
    expect(prisma.cama.findMany.mock.calls[0][0].where.habitacion.sala.servicio).toEqual({ establecimientoId: 3, id: 9 });
    expect(prisma.egresoHospitalario.findMany.mock.calls[0][0].where.ingreso.cama.habitacion.sala.servicio).toEqual({ establecimientoId: 3, id: 9 });
    expect(result.analisisServicios[0]).toMatchObject({ servicio: 'Servicio destino', ocupadas: 1 });
  });
  it('no confunde camas bloqueadas con disponibles y no inventa promedio sin egresos', async () => {
    const { service } = setup(['OCUPADA', 'DISPONIBLE', 'LIMPIEZA', 'MANTENIMIENTO', 'RESERVADA'].map(cama));
    const result = await service.obtenerEstadisticas(3);
    expect(result.indicadores).toMatchObject({ totalCamas: 5, ocupacionPorcentual: 20, promedioEstadia: null });
    expect(result.tendenciaOcupacion.map(e => e.value)).toEqual([1, 1, 1, 1, 1]);
  });
  it('conserva fracciones de día y reporta fechas invertidas sin usar valor absoluto', async () => {
    const { service } = setup([cama('DISPONIBLE')], [
      egreso('2026-09-01T00:00:00Z', '2026-09-01T12:00:00Z'),
      egreso('2026-09-02T00:00:00Z', '2026-09-01T12:00:00Z'),
    ]);
    const result = await service.obtenerEstadisticas(3);
    expect(result.indicadores).toMatchObject({ promedioEstadia: 0.5, estadiasInvalidas: 1, totalEgresosMes: 2 });
    expect(result.analisisServicios[0].egresos).toBe(2);
  });
  it('rechaza consultas sin establecimiento', async () => {
    const { service, prisma } = setup([]);
    await expect(service.obtenerEstadisticas(undefined as any)).rejects.toThrow('establecimiento');
    expect(prisma.cama.findMany).not.toHaveBeenCalled();
  });
  it('acota el período al inicio del mes y la hora local actual', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T02:00:00Z'));
    try {
      const { service, prisma } = setup([]);
      const result = await service.obtenerEstadisticas(3);
      expect(prisma.egresoHospitalario.findMany.mock.calls[0][0].where.fechaEgreso).toEqual({
        gte: new Date('2026-09-01T00:00:00Z'), lte: new Date('2026-09-30T20:00:00Z'),
      });
      expect(result.indicadores.giroCama).toBeNull();
    } finally { jest.useRealTimers(); }
  });
});
