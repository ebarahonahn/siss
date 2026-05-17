const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.controlNiñoSano.findMany({take: 5, orderBy: {id: 'desc'}});
  console.log(c);
}
main().finally(() => prisma.$disconnect());
