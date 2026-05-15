import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.pacienteMedicamento.count({
    where: { pacienteId: 4, fin: null }
  });
  console.log(`Medicamentos Activos: ${count}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
