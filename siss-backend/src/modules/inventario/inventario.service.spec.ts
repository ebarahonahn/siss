import { InventarioService } from './inventario.service';

describe('Inventario: ajustes y mínimo por establecimiento', () => {
  let service: InventarioService;
  let prisma: any;
  const actual = { id: 1, medicamentoId: 72, establecimientoId: 1, lote: 'A', cantidadActual: 200, cantidadMinima: 10 };
  beforeEach(() => {
    prisma = {
      inventario: {
        findFirst: jest.fn().mockResolvedValue(actual),
        findMany: jest.fn().mockResolvedValue([actual, { ...actual, id: 2, lote: 'B', cantidadActual: 10 }]),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...actual, ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      movimientoInventario: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    service = new InventarioService(prisma);
  });
  it('rechaza renombrar un lote sin modificar datos', async () => {
    await expect(service.actualizar(1, { lote: 'OTRO' }, 9)).rejects.toThrow('no puede modificarse');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('exige un motivo no vacío para modificar existencias', async () => {
    await expect(service.actualizar(1, { cantidadActual: 195, motivoAjuste: '  ' }, 9)).rejects.toThrow('motivo');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('guarda la diferencia y el motivo sin enviarlo como columna de inventario', async () => {
    await service.actualizar(1, { cantidadActual: 195, motivoAjuste: ' Conteo físico ' }, 9);
    expect(prisma.movimientoInventario.create).toHaveBeenCalledWith({ data: expect.objectContaining({ cantidad: -5, tipo: 'AJUSTE', motivo: 'Conteo físico', usuarioId: 9 }) });
    expect(prisma.inventario.update.mock.calls[0][0].data).not.toHaveProperty('motivoAjuste');
  });
  it('aplica el mínimo a todos los lotes del producto en un solo establecimiento', async () => {
    await service.actualizar(1, { cantidadMinima: 25 }, 9);
    expect(prisma.inventario.updateMany).toHaveBeenCalledWith({ where: { medicamentoId: 72, establecimientoId: 1, eliminadoEn: null }, data: expect.objectContaining({ cantidadMinima: 25 }) });
    expect(prisma.movimientoInventario.create).not.toHaveBeenCalled();
  });
  it('no alerta por el lote de 10 si el total es 210 y el mínimo es 10', async () => {
    expect(await service.stockBajo(1)).toEqual([]);
  });
  it('devuelve el total del producto cuando alcanza el mínimo', async () => {
    prisma.inventario.findMany.mockResolvedValue([{ ...actual, cantidadActual: 4 }, { ...actual, id: 2, cantidadActual: 6 }]);
    expect(await service.stockBajo(1)).toEqual([expect.objectContaining({ cantidadActual: 10, cantidadMinima: 10 })]);
  });
});
