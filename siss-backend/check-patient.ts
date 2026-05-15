import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const dni = "0801197106887";
  const patient = await prisma.paciente.findUnique({
    where: { dni },
  });
  console.log(JSON.stringify(patient));
}
main().catch(console.error).finally(() => prisma.$disconnect());
