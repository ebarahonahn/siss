const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recetas = await prisma.receta.findMany({
    include: {
      detalles: { include: { medicamento: true } }
    },
    take: 5
  });

  recetas.forEach(r => {
    r.detalles.forEach(d => {
      console.log(`Detalle ID: ${d.id}`);
      console.log(`Medicamento Object:`, JSON.stringify(d.medicamento, null, 2));
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
