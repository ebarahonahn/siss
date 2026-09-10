import { DispensacionService } from './dispensacion.service';

describe('DispensacionService: búsqueda por DNI', () => {
  const prisma = {
    receta: { updateMany: jest.fn(), findMany: jest.fn() },
  };
  let service: DispensacionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DispensacionService(prisma as any);
    jest.spyOn(service, 'obtenerVigenciaReceta').mockResolvedValue(30);
    prisma.receta.findMany.mockResolvedValue([]);
  });

  it.each(['0801199012345', '0801-1990-12345', ' 0801 1990 12345 '])(
    'busca %s sin separadores y conserva el establecimiento y estados autorizados',
    async (identificador) => {
      await service.buscarRecetasPendientes(identificador, 7);
      expect(prisma.receta.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          establecimientoId: 7,
          estado: { in: ['PENDIENTE', 'PARCIAL'] },
          paciente: { OR: expect.arrayContaining([{ dni: { contains: '0801199012345' } }]) },
        }),
      }));
    },
  );

  it.each(['', '  ', '08', undefined])('ignora identificadores incompletos: %s', async (term) => {
    expect(await service.buscarRecetasPendientes(term as any, 7)).toEqual([]);
    expect(prisma.receta.updateMany).not.toHaveBeenCalled();
    expect(prisma.receta.findMany).not.toHaveBeenCalled();
  });
});
