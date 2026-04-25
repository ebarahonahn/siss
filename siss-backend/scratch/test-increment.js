const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIncrement() {
  const medicamentoId = 1; // MED-001
  const establecimientoId = 1;
  const lote = 'TEST-LOTE';
  const usuarioId = 1;

  console.log('--- TEST INCREMENTO ---');
  
  // Limpiar previo
  await prisma.inventario.deleteMany({ where: { lote: 'TEST-LOTE' } });

  // 1. Primera carga (10 unidades)
  await prisma.inventario.upsert({
    where: { medicamentoId_establecimientoId_lote: { medicamentoId, establecimientoId, lote } },
    update: { cantidadActual: { increment: 10 } },
    create: { medicamentoId, establecimientoId, lote, cantidadActual: 10, cantidadMinima: 1 }
  });

  let stock = await prisma.inventario.findFirst({ where: { lote } });
  console.log('Stock después de carga 1 (10):', stock.cantidadActual);

  // 2. Segunda carga (5 unidades)
  await prisma.inventario.upsert({
    where: { medicamentoId_establecimientoId_lote: { medicamentoId, establecimientoId, lote } },
    update: { cantidadActual: { increment: 5 } },
    create: { medicamentoId, establecimientoId, lote, cantidadActual: 5, cantidadMinima: 1 }
  });

  stock = await prisma.inventario.findFirst({ where: { lote } });
  console.log('Stock después de carga 2 (5):', stock.cantidadActual);
  
  if (stock.cantidadActual === 15) {
    console.log('V SUCCESS: El stock se incrementó correctamente.');
  } else {
    console.log('X FAILURE: El stock no se incrementó como se esperaba.');
  }
}

testIncrement().catch(console.error).finally(() => prisma.$disconnect());
