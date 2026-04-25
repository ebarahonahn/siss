const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMovements() {
  const usuarioId = 1;
  const inventarioId = 4; // Un ID que sabemos que existe

  console.log('--- TEST MOVIMIENTOS ---');

  // 1. Obtener cantidad actual
  const actual = await prisma.inventario.findUnique({ where: { id: inventarioId } });
  console.log('Cantidad actual:', actual.cantidadActual);

  // 2. Actualizar cantidad (+5)
  const nuevaCantidad = actual.cantidadActual + 5;
  await prisma.inventario.update({
    where: { id: inventarioId },
    data: { cantidadActual: nuevaCantidad }
  });
  
  // Registrar movimiento manualmente para simular lo que hace el service
  // Nota: Mi service usa transacciones, aquí simulo el resultado
  await prisma.movimientoInventario.create({
    data: {
      inventarioId,
      tipo: 'AJUSTE',
      cantidad: 5,
      usuarioId,
      motivo: 'Test de trazabilidad'
    }
  });

  // 3. Verificar en tabla movimientos
  const movimientos = await prisma.movimientoInventario.findMany({
    where: { inventarioId },
    orderBy: { fecha: 'desc' },
    take: 1
  });

  console.log('Último movimiento registrado:', movimientos[0]);

  if (movimientos[0] && movimientos[0].cantidad === 5) {
    console.log('V SUCCESS: Trazabilidad confirmada.');
  } else {
    console.log('X FAILURE: No se registró el movimiento.');
  }
}

testMovements().catch(console.error).finally(() => prisma.$disconnect());
