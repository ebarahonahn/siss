import { Reflector } from '@nestjs/core';
import { ReportesService } from './reportes.service';
import { ReporteAccesoGuard } from './reporte-acceso.guard';

describe('Acceso granular a reportes', () => {
  const catalogo = ['productividad', 'morbilidad', 'citas', 'demografia', 'inventario', 'kardex']
    .map((slug, id) => ({ id: id + 1, slug, permiso: `reportes:${slug}` }));
  function setup(asignaciones: { reporteId: number }[] = []) {
    const prisma = {
      reporteDisponible: { findMany: jest.fn().mockResolvedValue(catalogo) },
      usuarioReporte: { findMany: jest.fn().mockResolvedValue(asignaciones) },
      historiaClinica: { count: jest.fn().mockResolvedValue(3) },
      paciente: { count: jest.fn().mockResolvedValue(4) },
      inventario: { count: jest.fn().mockResolvedValue(5) },
      cita: { count: jest.fn().mockResolvedValue(6) },
    };
    return { prisma, service: new ReportesService(prisma as any) };
  }

  it.each([
    ['reportes:productividad', 'reportes:citas'],
    { reportes: ['productividad', 'citas'] },
  ])('solo lista los dos reportes autorizados: %j', async permisos => {
    const { service } = setup();
    const result = await service.getMisReportes(8, 'ODONTOLOGIA', permisos);
    expect(result.map(r => r.slug)).toEqual(['productividad', 'citas']);
  });

  it.each([[], ['reportes'], ['reportes:leer', 'reportes:generar'], { reportes: true }])(
    'el acceso general al módulo no habilita descargas: %j', async permisos => {
      expect(await setup().service.getMisReportes(8, 'ODONTOLOGIA', permisos)).toEqual([]);
    },
  );

  it('respeta la lista individual aunque el rol tenga más reportes', async () => {
    const { service } = setup([{ reporteId: 3 }]);
    expect((await service.getMisReportes(8, 'ODONTOLOGIA', catalogo.map(r => r.permiso))).map(r => r.slug)).toEqual(['citas']);
  });

  it('conserva el catálogo completo para ADMIN', async () => {
    expect(await setup().service.getMisReportes(1, 'ADMIN', [])).toEqual(catalogo);
  });

  it('prioriza permisos vigentes de la asignación sobre lista antigua y token', async () => {
    const { service, prisma } = setup([{ reporteId: 1 }, { reporteId: 2 }]);
    (prisma as any).asignacionUsuario = { findFirst: jest.fn().mockResolvedValue({ permisos: ['reportes:citas'] }) };
    expect((await service.getMisReportes(2, 'MEDICO', ['reportes:productividad'], 1, 1)).map(r => r.slug)).toEqual(['citas']);
    expect((prisma as any).asignacionUsuario.findFirst).toHaveBeenCalledWith({ where: { id: 1, usuarioId: 2, activo: true, establecimientoId: 1 }, select: { permisos: true } });
    expect(prisma.usuarioReporte.findMany).not.toHaveBeenCalled();
  });

  it('una lista explícita vacía revoca todos los reportes', async () => {
    const { service, prisma } = setup([{ reporteId: 1 }]);
    (prisma as any).asignacionUsuario = { findFirst: jest.fn().mockResolvedValue({ permisos: [] }) };
    expect(await service.getMisReportes(2, 'MEDICO', ['reportes:productividad'], 1, 1)).toEqual([]);
  });

  it('no usa permisos de una asignación ajena o inactiva', async () => {
    const { service, prisma } = setup([{ reporteId: 1 }]);
    (prisma as any).asignacionUsuario = { findFirst: jest.fn().mockResolvedValue(null) };
    expect(await service.getMisReportes(2, 'MEDICO', ['reportes:productividad'], 99, 1)).toEqual([]);
  });

  it('no consulta ni expone indicadores no autorizados', async () => {
    const { service, prisma } = setup();
    const result = await service.getDashboardKPIs(1, new Date('2026-09-10'), new Date('2026-09-10'), ['productividad', 'citas']);
    expect(result).toMatchObject({ consultasHoy: 3, citasPendientes: 6, pacientesNuevos: null, stockCritico: null });
    expect(prisma.paciente.count).not.toHaveBeenCalled();
    expect(prisma.inventario.count).not.toHaveBeenCalled();
  });

  it('bloquea la descarga directa de un reporte no autorizado', async () => {
    const { service } = setup();
    const reflector = new Reflector();
    const handler = () => {};
    Reflect.defineMetadata('reporteSlug', 'inventario', handler);
    const context = {
      getHandler: () => handler,
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 8, rol: 'ODONTOLOGIA', permisos: ['reportes:productividad', 'reportes:citas'] } }) }),
    } as any;
    const guard = new ReporteAccesoGuard(reflector, service);
    await expect(guard.canActivate(context)).rejects.toThrow('No tiene autorizado este reporte');
    Reflect.defineMetadata('reporteSlug', 'citas', handler);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
