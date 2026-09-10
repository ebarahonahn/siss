import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reportes = await (prisma as any).reporteDisponible.findMany();
  console.log('REPORTES DISPONIBLES EN DB:', JSON.stringify(reportes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
