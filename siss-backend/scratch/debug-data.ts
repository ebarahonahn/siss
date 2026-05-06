import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.paciente.count();
  const all = await prisma.paciente.findMany({ take: 5 });
  console.log('Count:', count);
  console.log('Sample:', JSON.stringify(all, null, 2));
}
main().finally(() => prisma.$disconnect());
