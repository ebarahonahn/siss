import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const d = await prisma.dispensacion.findMany();
  console.log('Total dispensaciones:', d.length);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
