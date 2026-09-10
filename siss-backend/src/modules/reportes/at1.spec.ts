import { ReportesService } from './reportes.service';
import { ReportesExportService } from './reportes-export.service';
import { ReportesController } from './reportes.controller';
import * as ExcelJS from 'exceljs';

describe('AT-1 SISS', () => {
  const inicio = new Date('2026-09-10T00:00:00Z');
  const fin = new Date('2026-09-10T23:59:59Z');
  function setup(nacimiento = '2000-09-11') {
    const historia = {
      id: 4, fecha: new Date('2026-09-10T13:00:00Z'),
      medico: { nombres: 'Médico', apellidos: 'Ejemplo', numeroColegiado: '00123' },
      cita: { tipo: 'PRIMERA_VEZ', especialidad: { nombre: 'Odontología' }, establecimiento: { nombre: 'Centro de atención' } },
      paciente: { numeroExpediente: '00001', dni: '0010200300001', nombres: 'Paciente', apellidos: 'Ejemplo', fechaNacimiento: new Date(nacimiento), sexo: { nombre: 'Femenino' }, departamento: { nombre: 'Departamento' }, municipio: { nombre: 'Municipio' }, comunidad: 'Comunidad', establecimiento: { nombre: 'Centro de registro' } },
      diagnosticos: [
        { codigoCIE10: 'K02.9', descripcion: 'Diagnóstico ejemplo', tipo: 'PRINCIPAL' },
        { codigoCIE10: 'Z01.2', descripcion: 'Segundo diagnóstico', tipo: 'SECUNDARIO' },
      ],
    };
    const prisma = { historiaClinica: { findMany: jest.fn().mockResolvedValue([historia]) } };
    return { service: new ReportesService(prisma as any), prisma, historia };
  }
  it('exporta una fila por atención con diagnósticos y hora literal', async () => {
    const { service, prisma } = setup();
    const data = await service.getAt1Data(inicio, fin, 1, 8);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ edad: '25 años', hora: '13:00', establecimiento: 'Centro de atención', medico: 'Médico Ejemplo', identidad: '0010200300001' });
    expect(data[0].diagnosticos).toContain('K02.9');
    expect(data[0].diagnosticos).toContain('Z01.2');
    expect(prisma.historiaClinica.findMany.mock.calls[0][0].where).toMatchObject({ medicoId: 8, eliminadoEn: null, fecha: { gte: inicio, lte: fin }, OR: [{ cita: { establecimientoId: 1 } }, { citaId: null, paciente: { establecimientoId: 1 } }] });
  });
  it.each([['2026-09-01', '9 días'], ['2026-05-10', '4 meses'], ['2025-09-10', '1 años']])('calcula edad histórica de %s', async (nacimiento, edad) => {
    expect((await setup(nacimiento).service.getAt1Data(inicio, fin, 1, 8))[0].edad).toBe(edad);
  });
  it('no inventa especialidad o tipo cuando no hay cita', async () => {
    const { service, historia } = setup();
    (historia as any).cita = null;
    expect((await service.getAt1Data(inicio, fin, 1, 8))[0]).toMatchObject({ especialidad: '', tipo: '', establecimiento: 'Centro de registro' });
  });
  it('genera Excel válido preservando identidad y expediente como texto', async () => {
    const data = await setup().service.getAt1Data(inicio, fin, 1, 8);
    const book = new ReportesExportService().crearLibroAt1(data, '2026-09-10', '2026-09-10');
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(await book.xlsx.writeBuffer());
    const sheet = loaded.getWorksheet('AT-1')!;
    expect(sheet.getCell('J6').value).toBe('00001');
    expect(sheet.getCell('K6').value).toBe('0010200300001');
    expect(sheet.getCell('Q6').value).toContain('Z01.2');
    expect(sheet.pageSetup.orientation).toBe('landscape');
    expect(sheet.getCell('A2').value).toContain('Total de atenciones: 1');
  });
  it('informa cuando no hay atenciones', () => {
    const sheet = new ReportesExportService().crearLibroAt1([], '2026-09-10', '2026-09-10').getWorksheet('AT-1')!;
    expect(sheet.getCell('A6').value).toContain('No hay atenciones');
  });
  it('el endpoint valida fechas y aplica el alcance de la sesión', async () => {
    const svc = { getAt1Data: jest.fn().mockResolvedValue([]) };
    const exporter = { generarExcelAt1: jest.fn() };
    const controller = new ReportesController(svc as any, exporter as any);
    const user = { id: 8, rol: 'ODONTOLOGIA', establecimientoId: 1 };
    await expect(controller.exportExcelAt1(user, '2026-02-30', '2026-09-10', '', {} as any)).rejects.toThrow('rango');
    await expect(controller.exportExcelAt1(user, '2026-09-11', '2026-09-10', '', {} as any)).rejects.toThrow('rango');
    expect(svc.getAt1Data).not.toHaveBeenCalled();
    await controller.exportExcelAt1(user, '2026-09-10', '2026-09-10', '', {} as any);
    expect(svc.getAt1Data).toHaveBeenCalledWith(inicio, new Date('2026-09-10T23:59:59.999Z'), 1, 8);
  });
  it('requiere el permiso específico para aparecer en el catálogo', async () => {
    const reporte = { id: 10, slug: 'at-1', permiso: 'reportes:at-1' };
    const service = new ReportesService({ reporteDisponible: { findMany: async () => [reporte] }, usuarioReporte: { findMany: async () => [] } } as any);
    expect(await service.getMisReportes(8, 'ODONTOLOGIA', ['reportes:citas'])).toEqual([]);
    expect(await service.getMisReportes(8, 'ODONTOLOGIA', ['reportes:at-1'])).toEqual([reporte]);
  });
});
