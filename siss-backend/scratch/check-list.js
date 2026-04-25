const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkListing() {
  const NO_ELIMINADO = { eliminadoEn: null };
  const where = { ...NO_ELIMINADO };
  // Simular listarTodos() sin establecimientoId
  const res = await prisma.inventario.findMany({
    where,
    include: { medicamento: true, establecimiento: true }
  });
  console.log('Total inv sin filtro:', res.length);
  res.forEach(i => {
    console.log(`ID: ${i.id}, Med: ${i.medicamento.codigo}, Est: ${i.establecimientoId}, NavName: ${i.establecimiento?.nombre}`);
  });
}

checkListing().catch(console.error).finally(() => prisma.$disconnect());
