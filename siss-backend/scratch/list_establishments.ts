import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const establishments = await prisma.establecimiento.findMany({
    orderBy: { creadoEn: 'asc' }
  });
  console.log(JSON.stringify(establishments, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
