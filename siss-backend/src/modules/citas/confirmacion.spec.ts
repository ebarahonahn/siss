import { CitasService } from './citas.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Confirmación manual de citas', () => {
  const prisma = { cita: { updateMany: jest.fn() } };
  const user = { id: 7, rol: 'RECEPCION', establecimientoId: 2 };
  let service: CitasService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new CitasService(prisma as any, {} as any);
    jest.spyOn(service, 'listar').mockResolvedValue([{ id: 4 }] as any);
    prisma.cita.updateMany.mockResolvedValue({ count: 1 });
  });
  it('restringe la actualización atómica a una cita programada futura visible', async () => {
    await expect(service.confirmar(4, user)).resolves.toEqual({ id: 4, estado: 'CONFIRMADA' });
    expect(service.listar).toHaveBeenCalledWith(2, ['RECEPCION'], 7, undefined, undefined, user);
    expect(prisma.cita.updateMany).toHaveBeenCalledWith({
      where: { id: 4, estado: 'PROGRAMADA', fechaHora: { gte: expect.any(Date) } },
      data: { estado: 'CONFIRMADA' },
    });
  });
  it('rechaza citas fuera del alcance del usuario', async () => {
    await expect(service.confirmar(9, user)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.cita.updateMany).not.toHaveBeenCalled();
  });
  it('rechaza pacientes en el registro manual del personal', async () => {
    await expect(service.confirmar(4, { ...user, rol: 'PACIENTE' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.cita.updateMany).not.toHaveBeenCalled();
  });
  it('no sobrescribe estados cambiados concurrentemente ni confirma citas vencidas', async () => {
    prisma.cita.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.confirmar(4, user)).rejects.toBeInstanceOf(ConflictException);
  });
});
