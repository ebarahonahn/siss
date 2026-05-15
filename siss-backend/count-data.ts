import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.receta.count({
    where: { pacienteId: 4 }
  });
  console.log(`Recetas: ${count}`);
  const historyCount = await prisma.historiaClinica.count({
    where: { pacienteId: 4 }
  });
  console.log(`Historia: ${historyCount}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
