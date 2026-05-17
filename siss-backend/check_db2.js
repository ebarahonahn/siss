const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.historiaClinica.findMany({take: 5, orderBy: {id: 'desc'}, select: {id: true, pacienteId: true, subjetivo: true}});
  console.log(c);
}
main().finally(() => prisma.$disconnect());
