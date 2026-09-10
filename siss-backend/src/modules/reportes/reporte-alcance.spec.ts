import { resolverAlcanceReporte } from './reporte-alcance';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';

describe('Alcance de datos de reportes', () => {
  const user = { id: 8, rol: 'ODONTOLOGIA', establecimientoId: 1 };
  const centroClinico = { OR: [{ cita: { establecimientoId: 1 } }, { citaId: null, paciente: { establecimientoId: 1 } }] };
  const inicio = new Date('2026-09-10T00:00:00Z');
  const fin = new Date('2026-09-10T23:59:59Z');

  it.each(['ODONTOLOGIA', 'MEDICO', 'MEDICO_PEDIATRA', 'ENFERMERA', 'FARMACEUTICO', 'EPIDEMIOLOGO'])('restringe %s al usuario y centro de la sesión', rol => {
    expect(resolverAlcanceReporte({ ...user, rol })).toEqual({ establecimientoId: 1, usuarioId: 8 });
    expect(() => resolverAlcanceReporte({ ...user, rol }, '2')).toThrow('otro establecimiento');
  });
  it.each(['ADMIN_ESTABLECIMIENTO', 'RECEPCIONISTA'])('permite a %s ver el centro pero no otros centros', rol => {
    expect(resolverAlcanceReporte({ ...user, rol })).toEqual({ establecimientoId: 1, usuarioId: undefined });
    expect(() => resolverAlcanceReporte({ ...user, rol }, '2')).toThrow();
  });
  it('conserva el alcance global del administrador', () => {
    expect(resolverAlcanceReporte({ ...user, rol: 'ADMIN' })).toEqual({ establecimientoId: undefined });
    expect(resolverAlcanceReporte({ ...user, rol: 'ADMIN' }, '2')).toEqual({ establecimientoId: 2 });
  });
  it('deniega sesiones sin centro', () => {
    expect(() => resolverAlcanceReporte({ ...user, establecimientoId: undefined })).toThrow();
  });

  function setup() {
    const model = () => ({ findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), groupBy: jest.fn().mockResolvedValue([]) });
    const prisma = { cita: model(), historiaClinica: model(), paciente: model(), diagnostico: model(), movimientoInventario: model(), vacunacionRegistro: model(), catVacuna: model(), inventario: model() };
    return { prisma, service: new ReportesService(prisma as any) };
  }
  it('filtra citas y productividad por médico antes de exportar', async () => {
    const { service, prisma } = setup();
    await service.getCitasData(inicio, fin, 1, 8);
    await service.getProductividadData(inicio, fin, 1, 8);
    for (const model of [prisma.cita, prisma.historiaClinica]) {
      expect(model.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ medicoId: 8 }) }));
    }
    expect(prisma.cita.findMany.mock.calls[0][0].where.establecimientoId).toBe(1);
    expect(prisma.historiaClinica.findMany.mock.calls[0][0].where).toMatchObject(centroClinico);
  });
  it('morbilidad usa el centro del encuentro y su médico, no otras asignaciones del médico', async () => {
    const { service, prisma } = setup();
    await service.getMorbilidadData(inicio, fin, 1, 8);
    expect(prisma.diagnostico.findMany.mock.calls[0][0].where.historia).toEqual({ fecha: { gte: inicio, lte: fin }, ...centroClinico, medicoId: 8 });
  });
  it('limita demografía a pacientes vinculados al usuario dentro del centro', async () => {
    const { service, prisma } = setup();
    await service.getDemografiaData(1, 8);
    const where = prisma.paciente.findMany.mock.calls[0][0].where;
    expect(where.establecimientoId).toBe(1);
    expect(where.OR).toEqual([
      { citas: { some: { medicoId: 8, establecimientoId: 1, estado: { notIn: ['CANCELADA', 'NO_ASISTIO'] } } } },
      { historialClinico: { some: { medicoId: 8, ...centroClinico } } },
      { vacunas: { some: { aplicadoPorId: 8, establecimientoId: 1 } } },
    ]);
  });
  it('restringe kardex y vacunaciones al responsable', async () => {
    const { service, prisma } = setup();
    await service.getKardexData(inicio, fin, 1, 8);
    await service.getConsolidadoPaiData(inicio, fin, 1, 8);
    await service.getCoberturaData(inicio, fin, 1, 8);
    expect(prisma.movimientoInventario.findMany.mock.calls[0][0].where).toMatchObject({ usuarioId: 8, inventario: { establecimientoId: 1 } });
    expect(prisma.vacunacionRegistro.findMany.mock.calls[0][0].where).toMatchObject({ aplicadoPorId: 8, establecimientoId: 1 });
    expect(prisma.vacunacionRegistro.groupBy.mock.calls[0][0].where).toMatchObject({ aplicadoPorId: 8, establecimientoId: 1 });
  });
  it('aplica el mismo alcance a los indicadores', async () => {
    const { service, prisma } = setup();
    await service.getDashboardKPIs(1, inicio, fin, ['productividad', 'citas', 'demografia'], 8);
    expect(prisma.cita.count.mock.calls[0][0].where).toMatchObject({ medicoId: 8, establecimientoId: 1 });
    expect(prisma.historiaClinica.count.mock.calls[0][0].where).toMatchObject({ medicoId: 8, ...centroClinico });
    expect(prisma.paciente.count.mock.calls[0][0].where.OR).toHaveLength(3);
  });
  it.each(['ODONTOLOGIA', 'ADMIN_ESTABLECIMIENTO'])('el endpoint deriva el alcance de la sesión %s', async rol => {
    const { service, prisma } = setup();
    const exporter = { generarExcelCitas: jest.fn() };
    const controller = new ReportesController(service, exporter as any);
    await controller.exportExcelCitas({ ...user, rol }, '2026-09-10', '2026-09-10', undefined as any, {} as any);
    const where = prisma.cita.findMany.mock.calls[0][0].where;
    expect(where.establecimientoId).toBe(1);
    expect(where.medicoId).toBe(rol === 'ODONTOLOGIA' ? 8 : undefined);
  });
});
