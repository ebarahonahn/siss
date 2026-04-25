import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.departamento.count();
  console.log(`Departamentos: ${count}`);
  if (count > 0) {
    const first = await prisma.departamento.findFirst();
    console.log(`Ejemplo: ${JSON.stringify(first)}`);
  }
}
main().finally(() => prisma.$disconnect());
