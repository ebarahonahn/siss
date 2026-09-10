import { CitasService } from './citas.service';
import { DateUtils } from '../../common/utils/date-utils';

describe('Horario especial de citas', () => {
  afterEach(() => jest.restoreAllMocks());
  function setup(especial = true, ultima: Date | null = null) {
    jest.spyOn(DateUtils, 'getLiteralNow').mockReturnValue(new Date('2026-09-09T20:01:00Z'));
    const prisma = {
      excepcionAgenda: { findMany: jest.fn().mockResolvedValue(especial ? [{ tipo: 'CAMBIO_HORARIO', horaInicio: '13:00', horaFin: '23:59' }] : []) },
      agendaBase: { findFirst: jest.fn().mockResolvedValue({ horaInicio: '13:00', horaFin: '19:00' }) },
      cita: { findFirst: jest.fn().mockResolvedValue(ultima ? { fechaHora: ultima } : null) },
      parametroSistema: { findUnique: jest.fn().mockResolvedValue({ valor: '20' }) },
    };
    return { prisma, service: new CitasService(prisma as any, {} as any) };
  }
  it.each([null, new Date('2026-09-09T18:00:00Z')])('usa 23:59 aunque la jornada base termine a las 19:00', async ultima => {
    const { service, prisma } = setup(true, ultima);
    expect((await service.obtenerSiguienteHorarioDisponible(1, '2026-09-09', 2)).siguienteHoraISO).toBe('2026-09-09T20:10:00.000Z');
    expect(prisma.agendaBase.findFirst).not.toHaveBeenCalled();
  });
  it('conserva el límite base cuando no hay horario especial', async () => {
    const { service } = setup(false);
    await expect(service.obtenerSiguienteHorarioDisponible(1, '2026-09-09', 2)).rejects.toThrow('19:00');
  });
  it('no sugiere antes del inicio especial', async () => {
    const { service } = setup(true, new Date('2026-09-09T09:00:00Z'));
    jest.mocked(DateUtils.getLiteralNow).mockReturnValue(new Date('2026-09-09T10:00:00Z'));
    expect((await service.obtenerSiguienteHorarioDisponible(1, '2026-09-09', 2)).siguienteHoraISO).toBe('2026-09-09T13:00:00.000Z');
  });
});
