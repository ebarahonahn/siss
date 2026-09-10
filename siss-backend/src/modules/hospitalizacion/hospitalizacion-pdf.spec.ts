import { PdfService } from '../../common/services/pdf.service';
import { HospitalizacionController } from './hospitalizacion.controller';

describe('Descargas PDF de hospitalización', () => {
  it.each(['descargarKardexPdf', 'descargarPdf'] as const)(
    '%s genera y envía un PDF completo sin cerrar dos veces el flujo',
    async (metodo) => {
      const svc = {
        obtenerIngresoConDetalle: jest.fn().mockResolvedValue({ paciente: {} }),
        listarKardex: jest.fn().mockResolvedValue([]),
        listarSignosVitales: jest.fn().mockResolvedValue([]),
        listarNotasEvolucion: jest.fn().mockResolvedValue([]),
      };
      const res = { setHeader: jest.fn(), send: jest.fn() };
      const controller = new HospitalizacionController(svc as any, new PdfService());
      await controller[metodo](1, res as any);
      expect(res.send).toHaveBeenCalledTimes(1);
      const buffer = res.send.mock.calls[0][0] as Buffer;
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-');
      expect(buffer.toString('ascii').trimEnd().endsWith('%%EOF')).toBe(true);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    },
  );
});
