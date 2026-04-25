import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const citas = await prisma.cita.findMany({
    where: { fechaHora: { gte: new Date('2026-04-21T00:00:00Z'), lt: new Date('2026-04-22T00:00:00Z') } },
    include: { paciente: true }
  });
  console.log(JSON.stringify(citas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
