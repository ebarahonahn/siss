import { InventarioService } from './inventario.service';

describe('Historial por producto', () => {
  it('agrupa lotes y suma solo existencias activas no eliminadas', async () => {
    const prisma = { inventario: { findMany: jest.fn().mockResolvedValue([
      { medicamentoId: 7, medicamento: { nombreGenerico: 'Producto' }, activo: true, eliminadoEn: null, cantidadActual: 10 },
      { medicamentoId: 7, medicamento: { nombreGenerico: 'Producto' }, activo: true, eliminadoEn: null, cantidadActual: 15 },
      { medicamentoId: 7, medicamento: { nombreGenerico: 'Producto' }, activo: false, cantidadActual: 9 },
    ]) } };
    const result = await new InventarioService(prisma as any).productosConHistorial(2);
    expect(result).toHaveLength(1);
    expect(result[0].cantidadActual).toBe(25);
    expect(prisma.inventario.findMany.mock.calls[0][0].where).toEqual({ establecimientoId: 2 });
  });
  it('consulta todos los lotes del producto solo en el establecimiento solicitado', async () => {
    const prisma = { movimientoInventario: { findMany: jest.fn().mockResolvedValue([]) } };
    await new InventarioService(prisma as any).movimientosPorProducto(7, 2);
    expect(prisma.movimientoInventario.findMany.mock.calls[0][0]).toMatchObject({
      where: { inventario: { medicamentoId: 7, establecimientoId: 2 } },
      include: { inventario: { select: { lote: true } } },
    });
  });
});
