import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const patient = await prisma.paciente.findFirst({
    select: { id: true, dni: true }
  });
  console.log(JSON.stringify(patient));
}
main().catch(console.error).finally(() => prisma.$disconnect());
